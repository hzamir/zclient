
var BrowserEngine = {
    detect: function() {
        const UA = navigator.userAgent;
        this.isKHTML = /Konqueror|Safari|KHTML/.test(UA);
        this.isGecko = (/Gecko/.test(UA) && !this.isKHTML);
        this.isOpera = /Opera/.test(UA);
        this.isSafari = /Safari/.test(UA);
        this.isMSIE  = (/MSIE/.test(UA) && !this.isOpera);
        this.isFF =    (/Firefox/i.test(navigator.userAgent));
        this.isChrome = /Chrome/.test(UA);
        this.isMSIE7 = this.isMSIE && !(/MSIE 6\./.test(UA));  //isMSIE7 is a misnomer
        this.isMSIE7Only =  this.isMSIE && (/MSIE 7\./.test(UA));  //isMSIE7 is a misnomer
        this.isMSIE8 = this.isMSIE && (/MSIE 8\./.test(UA));
        this.isMSIE7Rendering = this.isMSIE7 && document.documentMode &&  document.documentMode == 7;
        this.hasIE8SpliceBug = this.isMSIE8 || (this.isMSIE7Only  && this.isMSIE7Rendering);

    }
};

BrowserEngine.detect();
//-------------------------------------------------------------------------
//------------------------------------------------------------------------------
// guarantee existence of this global, at least the only part we need
if(!exists(window,'$dbg')){
    var $dbg =  {rethrow: false};
}

function Publisher() {
    this.subscribers=[];
}
// publisher responsible for subscribing/unsubscribing subscribers!



Publisher.prototype =
    {
        constructor: Publisher
        ,subscribe:   function(s) { this.subscribers.push(s);}
        ,unsubscribe: function(s)
        {
            var a=this.subscribers;
            for(var i=0, l=a.length;i<l;++i) { if(a[i]==s){return a.splice(i,1);} }
        }
        ,publish: function(msg)
        {
            var len=this.subscribers.length;
            for(var i=0; i<len; ++i) {
                this.subscribers[i].receive(msg);
            }
        }
        // New flavor of publish, used by signaller, allows posting exceptions via signaller mechanism
        // and yes, I know that it is a backwards reference
        ,signal_publish: function(signaller, msg)
        {
            var len=this.subscribers.length;
            for(var i=0; i<len; ++i) {

                try {
                    this.subscribers[i].receive(msg);
                } catch(e) {
                    if(msg.signal != 'Signal/exception') {
                        msg.subscriber = i;
                        msg.exception = e;
                        $signaller.emit('Signal/exception', msg);
                    } else {
                        // do not allow exception signals to generate exceptions
                        Logger.error("Exception handling 'Signal/exception'!");
                    }
                    if($dbg.rethrow){
                        throw e; // rethrow here to see if the line number is in exception but just inaccessible to us
                    }
                } // end catch


            } // end for
        } // end signal_publish()

    }; // end instance methods
//------------------------------------------------------------------------------
// Use Signaller to define a set of signals, that others can connect to. and the other connects to them
// (sig = signal name string, and sub = subscriber

function Signaller(sender) {
    this.signals={};
    this.sender=sender;
    this.defaultSubscriber = null;
    this.recursion=0;
    this.deferred=[];  // deferred signals are serialized, and cannot nest
}

Signaller.prototype = {
    constructor: Signaller
    ,define: function(sig) {
        this.signals[sig]=new Publisher();
    }
    ,connect: function(sub, sig)
    {
        failNil(this.signals[sig], "Signal.connect(): There is no signal named '" + sig + "'");
        this.signals[sig].subscribe(sub);
    }
    ,disconnect: function(subscriber, signal) { this.signals[signal].unsubscribe(subscriber);    }

    // subscriber should be be delisted
    ,forget: function(subscriber)            { for(var i in this.signals){i.unsubscribe(subscriber);}   }
    ,emit: function(sig, msg, defer)
    {
        failNil(this.signals[sig], 'Signaller.emit(): ' + sig + ' is not defined');
        var o = {signal:sig, data:msg, sender:this.sender};

        // defer execution of certain signals until recursion level hits zero
        if(defer) {
            if(this.recursion > 0) {
                this.deferred.push(o);  // lets do this later
                return;
            }
        }

        // emit signal
        ++this.recursion;
// 	  Logger.log("recursion: %d, sig: %s", this.recursion, sig); //%%%
        this.signals[sig].signal_publish(this, o);
        --this.recursion;

        // on the way out, execute any pending deferred signals
        if(this.recursion === 0) {
//	  	Logger.log("recursion is now 0"); //%%%

            while(this.deferred.length > 0) {
                try {
                    o = this.deferred.shift();
                    var defsig = o.signal;
                    ++this.recursion;
                    this.signals[defsig].signal_publish(this, o);
                    --this.recursion;
                } catch(e) {
                    Logger.error("otherwise uncaught exception in deferred loop");
                }
            } // end while
        } // end if

    } // end emit

    // similar to emit, but signal cannot be emitted while any other signals are being processed.
    // IOW, emit executes dependent functions now, including all nested emits
    // whereas schedule serializes execution of signal to a time when no signals are being handled
    ,schedule: function(sig, msg)
    {
        this.emit(sig, msg, true);  // emit signal deferred
    }
};
var $signaller = new Signaller('$signaller');
$signaller.define('Signal/exception');   // define signal for uncaught exceptions from receivers
// convenience function to announce exception occurred.
// no action taken except via subscription to the signal
// so safe to embed in the code.
// can pass strings instead of exception objects also

var $lastError = null;

function trackException(e, s) {

    const o = s? {intro: s, ex: e }: e;  // if optional param s, combine with e in message

    $signaller.emit('Signal/exception', o);
}
//--------------------------------------------------------------------------------
function Stopwatch() {
    this.t_stop = null;
    this.t_start = new Date();
}

Stopwatch.prototype = {
    constructor: Stopwatch,
    stop:  function() {this.t_stop = new Date(); return this.t_stop - this.t_start; },
    start: function() {this.t_start = new Date(); this.t_stop = this.t_start; },
    reset: function() {var r = this.stop(); this.t_start = this.t_stop; return r; },
    force2Digits: function(n) { return (n<10)? '0'+n:''+n; },
    force3Digits: function(n) { return (n<10)? '00'+n: ((n<100)? '0'+n:''+n); },
    fixY2k: function(n) { return (n<1000)? n+1900:n;},
    date: function(t) {
        if(!t){
            t = new Date();
        }
        var m = this.force2Digits(t.getMonth()+1);
        var y = this.fixY2k(t.getFullYear());
        var d = this.force2Digits(t.getDate());
        return ''+y+m+d;
    },
    time: function(t) {
        var f = this.force2Digits;
        if(!t){
            t = new Date();
        }
        var h = f(t.getHours());
        var m = f(t.getMinutes());
        var s = f(t.getSeconds());
        var ms = this.force3Digits(t.getMilliseconds());
        return ''+h+m+s+'.'+ms;
    },

    timef: function(t) {
        var f = this.force2Digits;
        if(!t){
            t = new Date();
        }
        var h = f(t.getHours());
        var m = f(t.getMinutes());
        var s = f(t.getSeconds());
        var ms = this.force3Digits(t.getMilliseconds());
        return '<span style="color:blue">'+h+':'+m+':'+s+'.'+ms+"</span>";
    },

    timestamp: function() {var t = new Date(); return this.date(t)+'-'+this.time(t); }
};

function TimeMachine()
{
    // timezone difference in minutes for server machine
    //this.stimezone = 0; // number of minutes to add to gmt to get server's local time
    //this.ltimezone = 0; // number of minutes to add to browser's local time to get gmt

    // note that server and browser are in two different timezones
    this.bestRoundtrip =  1000*1000*1000;       // shortest roundtrip since accepting a time change
    this.bestLatency   = Math.round(this.bestRoundtrip*0.5);  // shortest measured since we accepted a time change

    // and receive a reply (we are assuming at this point webservers and servers have synchronized time)

    this.l2s_offset = 0; // offset to add to browser local_time to arrive at server local time
}


// 'private' method for accepting new server time as authoritative time source
TimeMachine.prototype._accept = function(roundtrip, servertime, localtime)
{
    var lat  = Math.round(roundtrip * 0.5); // guarantee an integer

    servertime += lat;

    this.l2s_offset = servertime - localtime;  // add offset to local time to get server time

    this.bestRoundtrip = roundtrip;
    this.bestLatency = lat;
//  Logger.log("_accept resets: %z", this);
    return true;
};

// call this method each time a new server time is reported
// a local time
TimeMachine.prototype.input = function(roundtrip, servertime, localtime)
{
    // the term delta here means "absolute time difference"
    // whereas offsets are values to be added to local time to achieve server time approximation

    /*
      we must adjust our l2s_offset (used to reckon approximate server time) when:

      a) latency improves -- our round trip time has shrunk from a previous roundtrip time
      b) there is a 'big' time shift (either on the server or the client machine)

      the 'big' time shift is defined as any time that the new delta is bigger than the old delta
      even factoring in the entire roundtrip time (and not the artificial 'latency' which is rt/2)
    */

    if(roundtrip < this.bestRoundtrip) {
        //Logger.log('*****correction (reason: LOWER latency)');
        return this._accept(roundtrip, servertime, localtime);
    } else {
        var noff = servertime + Math.round(roundtrip * 0.5)- localtime ;

        if(Math.abs(noff - this.l2s_offset) > roundtrip) { //todo: ????
            //Logger.log('*****correction (reason: TIME DIFF > roundtrip)');
            return this._accept(roundtrip, servertime, localtime)
        }
    }
    return false;
};

// using our reference time offset from the server, return
// our best guess as to correct server time
TimeMachine.prototype.now = function()
{
    var rawdate = new Date();
    return new Date(rawdate.getTime() +  this.l2s_offset);
};

TimeMachine.prototype.nowMillis = function()
{
    return (new Date()).getTime() +  this.l2s_offset;
};

//------------------------------------------------------------------------------

// given an array of objects, manage them in a pool
function Pool(arrayOfObjects)
{
    this.mPooled   = arrayOfObjects;  // take ownership of array
    this.mCapacity = arrayOfObjects.length;
    this.mWaiting  = [];  // functions waiting to execute on pool availability

    // while mPooled points to all resources (so we can monitor them)
    // mFree only tracks those that are available
    this.mFree = new Array(this.mCapacity);
    for(var i in arrayOfObjects){
        if(arrayOfObjects.hasOwnProperty(i)) {
            this.mFree[i] = arrayOfObjects[i];
        }
    }
}

Pool.prototype = {
    constructor: Pool

    // take lru object from free pool,  mark it busy
    ,pop: function() {
//		Logger.log("Pool.pop");
        if(this.mFree.length > 0){
            return this.mFree.shift();
        }
        return null;  // no items available now
    }

    // put item (back) into the pool
    // (no cheating, stick with what used to be in pool)
    ,push: function(item)
    {
        if(this.mWaiting.length) {        // function waiting on free object
//			Logger.log("Pool.push: executing waiting func"); //%%%
            this.mWaiting.shift()(item);  // dequeue fuction and run
        } else {
//			Logger.log("Pool.push: putting back into pool"); //%%%
            this.mFree.push(item);        // put it into the pool
        }
    },

    // get item from pool when available, and run function on that item
    wait: function(f)
    {
        var count = this.mWaiting.length;
        var pi = this.pop();
        if(pi) {
//			Logger.log("wait: no waiting"); //%%%
            f(pi);
        } else {
            ++count;
//			Logger.log("wait: yes waiting!!"); //%%%
            this.mWaiting.push(f);
        }
        return count;
    }

    ,available: function()
    {
        return this.mFree.length;
    }
    // how many was it initialized with
    ,capacity: function()
    {
        return this.mCapacity;
    }
};


// in development, json replacements for xml parsed versions
// not plugged into code yet.

// iterateEvents is a utility takes a value, which may be an either object or an array
// if it is an object, it writes one event for it of type signal
// if it is an array, it iterates through the the array and generates one event per
// if it is null,undefined, etc. it does nothing
// the reason for these wierd iterators is the xml->json translation convention
// in which when an xml style data structure is set up using infoset, there is no guidance as to
// whether there can be more than one of any given element. When there are multiple elements of one type
// they become arrays automatically, but if there should happen to be only one, the absence of a schema
// gives us no way to know, and so it is not encoded as an array in that case, forcing us to check
// if certain items that could have multiples are arrays or not
// at least the only way this possibility is expressed is by making an iterateXXX call,
// expressing the possibility that there may be more than one.
function iterateEvents(p, signal)
{
    if(p){
        if(p.splice) {
            for(var i = 0, len = p.length; i < len; ++i) {
                $signaller.emit(signal, p[i]);
            }
        } else {
            $signaller.emit(signal, p);
        }	// end if
    } // end if there is object
}

function iterateMap(m, f)
{
    for(var k in m) {
        if(m.hasOwnProperty(k)) {
            f(m[k]);
        }
    }
}

function iterateMapKey(m, f)
{
    for(var k in m) {
        if(m.hasOwnProperty(k)) {
            f(k, m[k]);
        }
    }
}

function iterateMapB(m, f)
{
    var ret;
    for(var k in m) {
        if(m.hasOwnProperty(k)) {
            var r = f(m[k]);
            if(r !== undefined) {
                ret = r; break;
            }
        }
    }
    return ret; // undefined is fine
}

function iterateMapKeyB(m, f)
{
    var ret;

    for(var k in m) {
        if(m.hasOwnProperty(k)) {
            var r = f(k, m[k]);
            if(r !== undefined) {
                ret = r; break;
            }
        }
    }
    return ret; // undefined is fine
}





function $_(s)
{
    return document.getElementById(s);
}

// functions to trapGetters and setters where available
function trapSetter(obj, propname, func, proto)
{
    if(obj.__proto__ && obj.__proto__.__defineSetter__)
    {
        if(proto) {
            obj.__proto__.__defineSetter__(propname, func);
        } else{
            obj.__defineSetter__(propname, func);
        }
    }
}

function trapGetter(obj, propname, func, proto)
{
    if(obj.__proto__ && obj.__proto__.__defineGetter__)
    {
        if(proto){
            obj.__proto__.__defineGetter__(propname, func);
        }else{
            obj.__defineGetter__(propname, func);
        }
    }
}


// crockford's object function with more suggestive name
function inherits(o) {
    function F() {}
    F.prototype = o;
    return new F();
}

// copy methods from derived class to base class
function copyMethods(baseCtor, derivedCtor)
{
    var destProto = derivedCtor.prototype;
    var srcProto  = baseCtor.prototype;
    for (var key in srcProto)
    {
        if (destProto[key] === undefined)
        {
            destProto[key] = srcProto[key];
        }
    }
}

var OOP =
    {
        extend: function(base, constructor, protobj)
        {
            protobj = protobj || {};
            protobj.parent = base.prototype;
            protobj.constructor = constructor;
            for (var key in base.prototype)
            {
                if (protobj[key] === undefined)
                {
                    protobj[key] = base.prototype[key];
                }
            }
            constructor.prototype = protobj;
            return constructor;
        },

        unimplemented: function() { throw "unimplemented"; }
    };

String.prototype.utilityDiv = document.createElement('div'); // a loose html element used for escape conversions

String.prototype.escapeHTML = function()
{
    if(document.body.innerText !==  undefined)
        this.utilityDiv.innerText = this;
    else
        this.utilityDiv.textContent = this;

    return this.utilityDiv.innerHTML;
};

String.prototype.unescapeHTML = function()
{
    if (this.search('&') < 0){ return this;}
    var unesc = this.replace(/&quot;/g, '"');
    unesc     = unesc.replace(/&lt;/g,   '<');
    unesc     = unesc.replace(/&gt;/g,   '>');
    return      unesc.replace(/&amp;/g,  '&');
};

Array.prototype.indexOf = function(obj)
{
    for(var i=0; i<this.length; i++)
    {
        if(this[i]==obj)
        {
            return i;
        }
    }
    return -1;
};

RegExp.escape = function(text) {
    if (!arguments.callee.sRE) {
        var specials = [
            '/', '.', '*', '+', '?', '|',
            '(', ')', '[', ']', '{', '}', '\\'
        ];
        arguments.callee.sRE = new RegExp(
            '(\\' + specials.join('|\\') + ')', 'g'
        );
    }
    return text.replace(arguments.callee.sRE, '\\$1');
};

function Stream(id, visible)
{
    this.id = id;
    this.signaller = new Signaller(this); // an event source associated with the Stream

    var el = document.createElement('iframe');
    failNil(el, 'Stream cannot create iframe: ' + id);
    el.setAttribute('id', id);
    el.style.border = '0px';

    if(visible) {
        el.style.width = '100%';
        el.style.height = '200px';
        el.style.backgroundColor = 'green';
    } else {
        el.style.width = '0px';
        el.style.height = '0px';
    }
    var el1 = document.body.appendChild(el);
    this.doc = el1.contentDocument || el1.contentWindow.document;

    //this.frame = window.frames[id];
    this.frame = window.frames[window.frames.length - 1]; // we just added it so it is here
}

Stream.prototype.start = function(url)
{
    this.frame.location = url;
    // this.doc.location.replace(url);
};

// use '*' for all tags
function getElementsByClassName(node, tag, classname)
{
    var regex = new RegExp('\\b'+classname+'\\b');
    var arr = node.getElementsByTagName(tag);

    var results = [];
    for (var i = 0, len = arr.length; i < len; ++i) {
        var strclass = arr[i].className;
        if (regex.test(strclass)){
            results.push(arr[i]);
        }
    }

    return results;
}


function Cache22()
{
    this.reset();
}

Cache22.prototype = {

    // return cache if it is good
    getCache: function(mod)
    {
        this.test = mod; // remember we asked for this
        return (mod > this.gen) ? null : this.cache;
    }

    // set cache for future reference
    ,setCache: function(cache, mod)
    {
        this.cache = cache;
        this.gen = (mod === undefined)? this.test: mod;
    }

    ,getMod: function()
    {
        return this.gen;
    }

    ,reset: function()
    {
        this.gen   = -1;
        this.test  = -2;
        this.cache = null;
    }

};

// lite function decorator generator that operates only Javascript classes (identified by their constructors)
/*
    example usage:
    AOPAdvice.before(Foo, print, func);
    should be more like:

    var advice =
    {
        before:
        {
            name1: function() {}  // works great where we want to decorate one exact function
            name2: function() {}
            name3: function() {}
        }

        around:
        {

        }
        after:
        {


        }
    };
    Asbestos.advise(classname, advice);  // apply the advice to the name classes prototype, or just do that manually with classname.prototype?
*/

// aspect system
var Asbestos = {

    // force existence of an asbestos property
    // the purpose of recordAdvice is only to know whether advice has already been run once (and what type)
    // it only makes a note of a previously unadvised method
    recordAdvice: function(o, method, note)
    {
        assert(o[method], "Asbestos cannot find method %s", method);
        assert(isFunction(o[method]), "Property %s is not a function", method);

        // is there a backup object?
        if(isObject(o._asbestos_)) {
            if(o._asbestos_[method]) { return o._asbestos_[method]; } // return that, without backing up
            o._asbestos_[method] = note;
            return false;                      // there was no backed up method
        }

        o._asbestos_ = {};                     // create a place holder for backups
        o._asbestos_[method] = note;           // record the note
        return false;                          // there was no backup before (by definition)
    },

    before: function(o, method, bf) {
        var orig = o[method];
        assert(orig, "Asbestos cannot find method %s to add advice", method);

        o[method] = function() {
            bf.apply(this, arguments);          // perform the before
            return orig.apply(this, arguments); // perform the original  (if advised > 1 time what happens?)
        };
    }, // end around

    after: function(o, method, af) {
        var orig = o[method];
        assert(orig, "Asbestos cannot find method %s to add advice", method);
        o[method] = function() {
            var result = orig.apply(this,arguments); // what if it throws an exception, what is good advice semantics
            af.apply(this, arguments); // perform the after advice
            return result; // cannot tamper with result
        };
    }, // end after
    // leaving out around advice for this pass, Keep it simple

    advise: function(o, advice)
    {
        o = o.prototype? o.prototype: o;
        var method;

        if(advice.before) {
            for(method in advice.before)
            {
                this.before(o, method, advice.before[method]);
            }
        }
        if(advice.after) {
            for(method in advice.after)
            {
                this.after(o, method, advice.after[method]);
            }
        }
    }
};

RegExp.escape = function(str) {
    var specials = new RegExp("[.*+?|()\\[\\]{}\\\\]", "g");
    return str.replace(specials, "\\$&");
};

var WindowPosition = (function() {
    var N, W, framePosition, frameChrome, setFramePosition, setFrameChrome;
    N = {};
    W = window;
    setFramePosition = function() {
        var tmp0;
        if (typeof framePosition !== 'undefined') {
            return;
        }
        tmp0 = {
            top : W.screenTop,
            left : W.screenLeft
        };
        W.moveTo(tmp0.left, tmp0.top);
        framePosition = {
            top : tmp0.top - W.screenTop,
            left : tmp0.left - W.screenLeft
        };
        W.moveTo(tmp0.left + framePosition.left, tmp0.top + framePosition.top);
    };
    setFrameChrome = function() {
        var tmp0, tmp1;
        if (typeof frameChrome !== 'undefined') {
            return;
        }
        tmp0 = N.innerSizeGet();
        W.resizeTo(tmp0.width, tmp0.height);
        tmp1 = N.innerSizeGet();
        frameChrome = {
            width : tmp0.width - tmp1.width,
            height : tmp0.height - tmp1.height
        };
        W.resizeTo(tmp0.width + tmp1.width, tmp0.height + tmp1.height);
    };
    N.outerPositionSet = function(position) {
        W.moveTo(position.left, position.top);
    };
    N.outerPositionGet = function() {
        if (typeof W.screenTop !== 'undefined') {
            setFramePosition();
            N.outerPositionGet = function() {
                return {
                    top : W.screenTop + framePosition.top,
                    left : W.screenLeft + framePosition.left
                };
            };
        } else if (typeof W.screenY !== 'undefined') {
            N.outerPositionGet = function() {
                return {
                    top : W.screenY,
                    left : W.screenX
                };
            };
        } else {
            N.outerPositionGet = function() {
                return {
                    top : 0,
                    left : 0
                };
            };
        }
        return N.outerPositionGet();
    };
    N.outerSizeSet = function(size) {
        W.resizeTo(size.width, size.height);
    };
    N.outerSizeGet = function() {
        if (W.outerWidth) {
            N.outerSizeGet = function() {
                return {
                    width : W.outerWidth,
                    height : W.outerHeight
                };
            };
        } else {
            setFrameChrome();
            N.outerSizeGet = function() {
                var size;
                size = N.innerSizeGet();
                size.width += frameChrome.width;
                size.height += frameChrome.height;
                return size;
            };
        }
        return N.outerSizeGet();
    };
    N.innerSizeSet = function(size) {
        setFrameChrome();
        N.innerSizeSet = function(size) {
            W.resizeTo(size.width + frameChrome.width, size.height + frameChrome.height);
        };
        N.innerSizeSet(size);
    };
    N.innerSizeGet = function() {
        if (typeof W.innerHeight === 'number') {
            N.innerSizeGet = function() {
                return {
                    width : W.innerWidth,
                    height : W.innerHeight
                };
            };
            return N.innerSizeGet();
        }
        var isDocumentElementHeightOff, node;

        isDocumentElementHeightOff = function() {
            var div, r;
            div = W.document.createElement('div');
            div.style.height = "2500px";
            W.document.body.insertBefore(div, W.document.body.firstChild);
            r = W.document.documentElement.clientHeight > 2400;
            W.document.body.removeChild(div);
            return r;
        };

        if (typeof W.document.clientWidth === 'number') {
            node = W.document;
        } else if ((W.document.documentElement && W.document.documentElement.clientWidth === 0) || isDocumentElementHeightOff()) {
            node = W.document.body;
        } else if (W.document.documentElement.clientHeight > 0) {
            node = W.document.documentElement;
        }
        N.innerSizeGet = function() {
            return {
                width : node.clientWidth,
                height : node.clientHeight
            };
        };
        return N.innerSizeGet();
    };
    return N;
})();

/**
 * @param number this represents the fraction of the next argument.
 * @param whole this is the whole whose previous argument represents a fractional part
 * @param inverse (optional) if zero (default), the function assumes that what is wanted is what
 *        percentage of the second input is represented by the first input.
 *        If number one, the function assumes that the first input number represents a percentage
 *        already, and that what is wanted is what number such percentage would yield when applied
 *        to the second argument.
 * @param rounder if passed must be a power of number 10 (10, 100, 100 etc): the returned number,
 *        if fractional, will be rounded in its floating part (if any) by this argument.
 *        Defaults to 100.
 */
function xpercent(number, whole, inverse, rounder) {
    whole = parseFloat(whole);
    if(!whole){
        whole=100;
    }
    number = parseFloat(number);
    if(!number){
        number=0;
    }
    if(!whole || !number){
        return 0;
    }
    rounder = parseFloat(rounder);
    rounder = (rounder && (!(rounder%10) || rounder==1) ) ? rounder : 100;

    return (!inverse) ? Math.round(((number*100)/whole) *rounder)/rounder :
        Math.round( ((whole*number)/100) *rounder)/rounder;
}


