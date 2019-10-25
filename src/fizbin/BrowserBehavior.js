
// --- browser right click disable section
document.oncontextmenu = function()
{
  return false;
};

function selectable(node)
{
    let nn = node.nodeName;
    const allowed = ['INPUT', 'TEXTAREA'];
    if(nn) {
        nn = nn.toUpperCase();
        for(let candidate in allowed){
            if(nn === candidate)
                return !node.disabled

        }
    }
    return false;
}

// --- document selection disable code---
// disable selection generally
//... no code anymore

// turn off browser function keys  and ENTER key at document level
// if you want your own keys enabled attach to something below the document
// level. Make a div containing everything in document if you need to.


// encapsulates 'guaranteed' non propagation of events
function noPropagate(e)
{
    if(e.stopPropagation) {
        e.stopPropagation();  // DOM model way
    } else {
        e.cancelBubble = true; // attempt to stop this way
    }

    if(e.preventDefault){
        e.preventDefault(); // DOM
    }else{
        e.returnValue = false; // IE
    }
    return false;
}


function noPropagateKey(e)
{
    if(e.stopPropagation) {
        e.stopPropagation();  // DOM model way
    } else {
        e.keyCode = 505;      // browser will not respond to this keycode
        e.cancelBubble = true; // attempt to stop this way
        return true;  // threw this in
    }

    if(e.preventDefault){
        e.preventDefault(); // DOM
    }else{
        e.returnValue = false; // IE
    }
    return false;
}

function disableBrowserFunctionKeys(e)
{
    const evt =  e || window.event;

    //Logger.log("key event");
    // Capture and remap F-key
    if (evt)
    {
        const key = evt.keyCode;


        // disable alt arrow keys, to prevent go to next/previous page by accident

        if(key === 9){
            return noPropagateKey(evt);  // disable tab keys
        }
        if(evt.altKey && key >= 37 && key <= 40){
            return noPropagateKey(evt);
        }
        if (key === 13 || (key >= 112 && key <= 123)) {
            return noPropagateKey(evt);
        }

    } else {
        return true;
    }
    return false;
}

function addHandler(el, eventname, handler)
{
    if(el.addEventListener) {
        el.addEventListener(eventname, handler, false);
    } else if(el.attachEvent) {
        el.attachEvent(eventname, handler);
    }
}

//---moved to here from Workspace, where it just doesn't belong
//Event handler for mouse wheel event.
function handleWheel(delta, ws)
{
    delta *= $dbg.wheel; // experiment with a scroll factor
    const agc = ws.gridcache;
    let i;
    if (delta < 0) {
        delta = -delta;
        for(i = 0; i <delta; ++i){
            agc.scrollDn(true);  // our universal scrollDn event
        }
    } else {
        for(i = 0; i <delta; ++i){
            agc.scrollUp(true);  // or universal scrollUp event
        }
    }
    agc.cheapSbUpdate();
}

function wheel(event, ws){
    if(!ws) {
        return;
    }
    let delta = 0;
    event = event || window.event;

    if (event.wheelDelta)
    { // IE/Opera.
        delta = event.wheelDelta/120;
        // In Opera 9, delta differs in sign as compared to IE.

        if (window.opera){delta = -delta;}
    }
    else if (event.detail)
    { // Mozilla case.
        // In Mozilla, sign of delta is different than in IE.
        //  Also, delta is multiple of 3.

        delta = -event.detail/3;
    }

    // If delta is nonzero, handle it.
    // Basically, delta is now positive if wheel was scrolled up,
    // and negative, if wheel was scrolled down.
    if (delta){handleWheel(delta, ws);}
    //Prevent default actions caused by mouse wheel.
    if (event.preventDefault){event.preventDefault();}
    event.returnValue = false;
}

function toClipboard(str)
{
    if(window.clipboardData && clipboardData.setData){
        clipboardData.setData("Text", str);
    }else{
        alert("This browser configuration doesn't support copying to clipboard");
    }
}

// horizontally scroll viewport if necessary so element is visible
// optional overlap is an item whose left edge defines viewport width, rather than width of viewport element
// (as in ETS case where the scrollbar is superimposed over the canvas)
function horizScrollIntoView(element, viewport, overlap)
{

    if(element) {

        const p = {};
        p.vs = viewport.scrollLeft;           // how scrolled left is the viewport currently
        p.v1 = gfi.DOM.getPosition(viewport)[0];           // ??? where is the viewport on the page
        p.v2 = overlap? overlap.offsetLeft: p.v1 + viewport.offsetWidth;            // where is the right of the viewport
        p.vd = p.v2 - p.v1;                   // how wide is our viewport?

        p.e1 = element.offsetLeft;            // where are we relative of element.offsetParent node
        p.ed = element.offsetWidth;
        p.e2 = p.e1 +  p.ed;

        p.clip1 = p.e1 - p.vs;                // how much of left of element clipped. (negative number if clipped)

        p.clip2 = (p.v2 - (p.e2 + p.v1)) + p.vs;       // how much of right of element is showing?

        //  logit("horizontal scrolling: %z", p);
        if(p.clip1 < 0){
            viewport.scrollLeft = p.e1;
        }else if(p.clip2 < 0){
            viewport.scrollLeft = p.e2 - p.vd;
        }
    }
}


function vertScrollIntoView(element, viewport, overlap)
{

    if(element) {
        const p = {};
        p.vs = viewport.scrollTop;           // how scrolled left is the viewport currently
        p.v1 = viewport.offsetTop;           // where is the viewport on the page
        p.v2 = overlap? overlap.offsetTop: p.v1 + viewport.offsetHeight;            // where is the right of the viewport
        p.vd = p.v2 - p.v1;                   // how wide is our viewport?

        p.e1 = element.offsetTop;            // where are we relative of element.offsetParent node
        p.ed = element.offsetHeight;
        p.e2 = p.e1 +  p.ed;

        p.clip1 = p.e1 - p.vs;                // how much of left of element clipped. (negative number if clipped)

        p.clip2 = (p.v2 - (p.e2 + p.v1)) + p.vs;       // how much of right of element is showing?

        //  logit("vertical scrolling: %z", p);
        if(p.clip1 < 0){
            viewport.scrollTop = p.e1;
        } else if(p.clip2 < 0) {
            viewport.scrollTop = p.e2 - p.vd;
        }
    }
}

