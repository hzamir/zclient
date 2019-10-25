
function isScalar(o)
{
    return  isNumber(o) || isString(o) || isBoolean(o) || isNull(o) || isUndefined(o);
}

function getclass(obj)
{
    var str = typename(obj);
    if(str.match(/^~/))
        return null;
    if(str.match(/(Object|Array)/))
        return "";

    return str;
}


//========================== dot language visualization starts here=========================
//graphical serialization function using dot language (as in graphviz)
// this is a destructive serialization that sets a special property to find cycles that it will not clean up
//null


var GraphViz = {
    visResults: []
    ,marks: []        /* used to mark/sweep objects (marking puts a magic property, sweeping deletes it */

    ,serfmt: {
        maxDepth: 10                  // how far we may recurse
        ,visdepth: 0                   // how far we have recursed

        ,functionClip: 280               // string clipping for functions
        ,functionWidth: 40
        ,arrayLimit:10                 // maximum number of entries to array


        //vvvvvvvvvvvvv begin unimplemented vvvvvvvvvvvvvv
        ,stringClip: 32                 // maximum size of string scalars to draw
        ,propertyLimit:20               // maximum number of properties for object
        ,propertyInclusionFilter:'.*'   // grep expression to include properties
        ,propertyExclusionFilter:''     // grep expression to exclude properties (only one should be set)


        // controls which items to image or leave out (not implemented)
        ,incArrays:true
        ,incNodes:true
        //^^^^^^^^ end unimplemented ^^^^^^^^^^

        ,incFunctions:true
        ,incScalars:false

        // counters for objects that are generated
        ,ctArray:0,
        ctObj:0,
        ctNode:0,
        ctNil:0,
        ctBool:0,
        ctStr:0,
        ctNum:0,
        ctFunc:0

        //----- formatting strings to use -----
        // stuff printed at beginning and end of strings
        ,prolog: "digraph {\nlabel=MyLabelHere\nrankdir=LR\ncompound=true\nnode[shape=Mrecord style=filled fillcolor=cornsilk]\nedge[color=blue style=solid]\n"
        ,epilog: "\n}/*end digraph*/\n"

        // format strings to use for rendering
        ,node: '  el%d [shape=diamond, fillcolor=palegreen]'
        , nil: '  x%0 [shape=point]'
        ,bool: '  b%d [shape=circle fillcolor=lightblue label=%s]'
        , str: '  s%d [shape=parallelogram fillcolor=orange label="\'%s\'"]'
        , num: '  n%d [shape=ellipse fillcolor=green label="%s"]'
        ,func: '  f%d[shape=box fontname=Courier fontsize=8 fillcolor=salmon label=@%s@]'
        , obj: '  o%d [label="%s"]'
        , arr: '  a%d [shape=record, fillcolor=plum label="%s"]'
    }

};


GraphViz.clear = function()
{
    this.visResults=[];
    this.sweep();
};

GraphViz.visNum = function(obj,options) {
    var n = options.ctNum++;
    this.visResults.push(sprintf(options.num, n, obj));
    return 'n'+n;
};

GraphViz.visString = function(obj, options) {
    var n = options.ctStr++;
    this.visResults.push(sprintf(options.str, n, obj));
    return 's'+n;
};

GraphViz.funcstr = function(f, options)
{
    var fstr = f.toSource();

    if(fstr.length > options.functionClip)
    {
        var tail = (fstr.substring(fstr.length-1,fstr.length) == ')')? ')':'';
        fstr = fstr.substring(0,options.functionClip);
        fstr += "......}" + tail;
    }

    if(fstr.length > options.functionWidth)
    {
        var segments = fstr.length / options.functionWidth;
        var segs = [];
        for(var i = 0; i < segments; ++i) {
            var start = i*options.functionWidth;
            var stop = start + options.functionWidth;
            segs.push(fstr.substring(start,stop));
            start = stop;
        }
        fstr = segs.join("\\\\\n");  // break lines with a \<newline>  escapes the \ as \\\\
    }

    return fstr;
};

GraphViz.mark = function(o)
{
    this.marks.push(o);
};
GraphViz.sweep = function()
{

    var marks = this.marks;
    var len = marks.length;

    for(var i = 0; i < len; ++i)
    {
        delete marks[i].$name$;  // sweep away the marks on the objects
    }
    this.marks = [];  // clear the array of marked objects

};

GraphViz.visFunc = function(f, options) {
    if(f.$name$) return f.$name$;

    this.mark(f);
    var n = options.ctFunc++;
    f.$name$ = 'f'+n;
    var fstr = sprintf(options.func, n,this.funcstr(f,options));

    //todo: real escaping routine
    fstr = fstr.replace(/\n/g,"\\n");  // fix newlines
    fstr = fstr.replace(/\"/g,'\\\"'); // fix double quotes
    fstr = fstr.replace(/\{/g, '\\{');
    fstr = fstr.replace(/\}/g, '\\}');
    fstr = fstr.replace(/@/g, '"');
    this.visResults.push(fstr);
    return f.$name$;
};

GraphViz.visBool = function(obj, options) {
    var n = options.ctBool++;
    this.visResults.push(sprintf(options.bool, n, obj));
    return 'b'+n;
};
GraphViz.visNull = function(obj,options) {
    var n = options.ctNil++;
    this.visResults.push(sprintf(options.nil, n, obj));
    return 'x'+n;
};

GraphViz.visNode = function(obj, options) {
    var n = options.ctNode++;
    this.visResults.push(sprintf(options.node, n, obj));
    return 'el'+n;
};

GraphViz.visObj = function(obj,options)
{
    if(obj.$name$)
        return obj.$name$;  // return generated name of node (whoops cannot detect cluster that way]

    this.mark(obj);
    var ofields = [];
    var i = 0;
    var oprops = [];
    for(var prop in obj) {
        if((!isFunction(obj[prop]) || obj.hasOwnProperty(prop)) &&/*((prop === 'graph') || obj.hasOwnProperty(prop)) && */ prop !== '$label$') {

            var fld = '<'+i+'>'+prop;
            var item = obj[prop];

            if(isScalar(item)) {
                fld += ':' + serialize(item).replace(/\"/g,'\\\"');
            }
            oprops.push(prop);
            ofields.push(fld);
            ++i;
        }
    }
    var oCount = options.ctObj++;     // determine the number of the object
    var oName = 'o'+oCount;
    obj.$name$ = oName;
    // produce a string for the cluster
    var clusterLabel = obj.$label$ || getclass(obj) || oName;
    var labelStr = clusterLabel+'|' + ofields.join('|'); // generate labels used for array entries

    var str = sprintf(options.obj, oCount, labelStr);
    this.visResults.push(str);  // push cluster and its array node


    // recurse through rendering array contents
    for(i=0; i < oprops.length; ++i)
    {
        var t = this.visualize(obj[oprops[i]],options); // render array contents
        // create an edge pointing to the node
        if(t) {
            this.visResults.push(sprintf("%s:%d:e->%s:w", oName, i, t));
        }
    }

    // setup connections between the array and the generated nodes
    // return name of this object

    return obj.$name$;
};


GraphViz.visArray = function(arr,options)
{
    if(arr.$name$)
        return arr.$name$;  // return generated name of node (whoops cannot detect cluster that way]

    this.mark(arr);
    var afields = [];
    var clippedLength= Math.min(arr.length, options.arrayLimit);
    var lastidx = arr.length-1;

    var fld, item;
    for(var i = 0; i < clippedLength; ++i)
    {
        fld = '<'+i+'>'+i;
        // peek at the type to see if it is scalar
        item = arr[i];
        if(isScalar(item)) {
            fld += ':' + serialize(item).replace(/\"/g,'\\\"');
        }

        afields.push(fld);
    }

    if(clippedLength < arr.length) {
        afields.push('...');
        fld = '<'+lastidx+'>'+lastidx;
        item = arr[i];
        if(isScalar(item)) {
            fld += ':' + serialize(item).replace(/\"/g,'\\\"');
        }
        afields.push(fld);
    }

    var aCount = options.ctArray++;     // determine the number of the object
    var aName = 'a'+aCount;
    arr.$name$ = aName;
    // produce a string for the cluster
    var clusterLabel = arr.$label$ || aName;

    var labelStr = '<l>'+clusterLabel+'|' + afields.join('|'); // generate labels used for array entries
    var str = sprintf(options.arr, aCount, labelStr);
    this.visResults.push(str);  // push cluster and its array node

    // recurse through rendering array contents

    var t;
    for(i=0; i < clippedLength; ++i)
    {
        t = this.visualize(arr[i], options); // render item array entry points to
        // create an edge pointing to the node
        if(t) {
            this.visResults.push(sprintf("%s:%d:e->%s:w", aName, i, t));
        }
    }

    if(clippedLength < arr.length) {

        t = this.visualize(arr[lastidx], options); // render last item pointed to
        // create an edge pointing to the node
        if(t) {
            this.visResults.push(sprintf("%s:%d:e->%s:w", aName, lastidx, t));
        }
    }


    // setup connections between the array and the generated nodes
    // return name of this object
    return arr.$name$;
};

GraphViz.render = function(arg, options) {
    var opts = options || {};
    this.clear();
    // {incScalars:true, incFunctions: false}
    var str = this.serialize(arg,opts);
    this.sweep(arg);     // remove the magic properties marked on objects while running visualize
    return str;
};

// given an options parameter, produce a complete set of options from
// the options object and defaults
GraphViz.configure = function(options)
{
    options = options || {};

    // copy all of the options
    for(var prop in this.serfmt)
    {
        if(options[prop] === undefined) {
            options[prop] = this.serfmt[prop];
        }
    }
    return options;

};

GraphViz.serialize = function(arg, options)
{
    options = this.configure(options);
    this.visualize(arg, options);

    var str = options.prolog + this.visResults.join('\n') + options.epilog;
    str = str.replace(/@/g,"\n");
    return str;
};


GraphViz.visualize = function(arg, options)
{
    try {
        if(++options.visdepth > options.maxDepth) {
            return null;
        }

        var argt = typeof arg;
        switch (argt) {

            case 'object':
                if(arg) {
                    if(arg.nodeType){
                        return this.visNode(arg, options);
                    }

                    if ((typename(arg) === 'Array') || arg.constructor === Array) {  //??? use my typename to ferret out mysterious unarraylike arrays
                        return this.visArray(arg, options);

                    } else if (typeof arg.toString != 'undefined') {
                        return this.visObj(arg, options);
                    }
                }
                return null;

            case 'unknown':   return null;
            case 'undefined': return null;
            case 'boolean':   return options.incScalars? this.visBool(arg, options): null;
            case 'function':  return options.incFunctions? this.visFunc(arg, options): null;
            case 'string':    return options.incScalars? this.visString(arg, options): null;
            case 'number':    return options.incScalars? this.visNum(arg, options): null;
            default:          return null;
        }
    } catch(sexc) {
        return null;
    } finally {
        --options.visdepth;
    }
};

