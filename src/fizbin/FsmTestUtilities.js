//--- define a couple signals we will use to monitor changes
$signaller.define('State/enter');
$signaller.define('State/exit');

var say = function(s,p,id) {
    $signaller.emit('State/enter', {id: id, state:s, previousState: p});
};  // a universal entry function
var said = function(s,n,id) {
    $signaller.emit('State/exit', {id: id, state:s, nextState: n});
};


function log(s, more)
{
    var str = sprintf.apply(window, arguments);
    //console.log.call(console.log, str);
    Logger.log(str);
}

// one of several state change subscribers
var stateLoggingSubscriber = {
    receive: function(o)
    {
        log('log state activity: %s, %z', o.signal, o.data);
    }
};


var  stateTableSubscriber = {
    receive: function(o)
    {
        var elemid = sprintf('state-%s-%s', o.data.id, o.data.state);
        var td = document.getElementById(elemid);
        if(td) {
            if (o.signal == 'State/enter')
            {
                td.className = 'on';
            }
            else if (o.signal = 'State/exit')
            {
                td.className = 'off';
            }
        }
    }
};


$signaller.connect(stateLoggingSubscriber, "State/enter");
$signaller.connect(stateLoggingSubscriber, "State/exit");
$signaller.connect(stateTableSubscriber, "State/enter");
$signaller.connect(stateTableSubscriber, "State/exit");


//------piece 2

// used to externally track the value of logical inputs to allow inversion by clicking on buttons
// (this loses the ability to test them by resubmitting the same value, but a special click might restore that)

var $fsmTestLogicals = {};


function generateGraph(fsm, stateDiagram)
{

    var text =  stateDiagram? fsm.visualize(): GraphViz.render(fsm); // todo: use "<fsm-id> rendering" for name
    var container = document.getElementById('visjs');

    //%%%% produce string instead
//    container.innerHTML = text;
//    return;

    var data = {
        dot: text
    };

    var options = {
        width: '800px',
        height: '800px',
        keyboard: {
            speed: {
                x: 10,
                y: 10,
                zoom: 0.02
            }
        }

    };
    var network = new vis.Network(container, data, options);

}

function renderCompiledFSMButton(machine)
{
    var purpose = 'visualizeObject-' + machine;
    var buttonid   = 'button-' + purpose;

    var funcstr = sprintf("generateGraph($fsmMap['%s'], false);", machine);

    var compileButton = sprintf('<input id="%s" type="button" onclick="%s" value="%s"/>&nbsp;&nbsp;',  buttonid, funcstr, "Compiled FSM Diagram");
    return  compileButton;
}


function renderStateMachineButton(machine)
{
    var purpose = 'visualizeStateMachine-' + machine;
    var buttonid   = 'button-' + purpose;

    var funcstr = sprintf("generateGraph($fsmMap['%s'], true);",  machine);

    var compileButton = sprintf('<input id="%s" type="button" onclick="%s" value="%s"/>&nbsp;&nbsp;',  buttonid, funcstr, "State Diagram");
    return  compileButton;
}


function renderLogicalInput(machine, inputName)
{
    var idstr   = sprintf('input-%s-%s', machine, inputName);
    $fsmTestLogicals[idstr] = 0;

    var funcstr = sprintf(
        "++$fsmTestLogicals['%s']; $fsmMap['%s'].%s($fsmTestLogicals['%s'] & 1); $_('%s').className = ($fsmTestLogicals['%s'] & 1)? 'on':'off';",
        idstr, machine, inputName, idstr, idstr, idstr);

    return sprintf('<input class="fsmlog" id="%s" type="button" onclick="%s" value="%s"/>&nbsp;&nbsp;',  idstr, funcstr, inputName, inputName);
}

function renderNumericInput(machine, inp)
{
    var idstr   = sprintf('input-%s-%s', machine, inp);
    var funcstr = sprintf("$fsmMap['%s'].%s(parseInt($_('%s').value));", machine, inp, idstr);

    return sprintf('%s: <input class="fsmnum" id="%s" type="text" onblur="%s" value=""/>&nbsp;&nbsp;',inp, idstr, funcstr);
}


function renderEvent(machine, evt)
{
    var funcstr = sprintf("$fsmMap['%s'].transduce(\'%s\');", machine, evt);
    var idstr = sprintf('event-%s-%s', machine, evt);

    return sprintf('<input class="fsmevt" id="%s" type="button" onclick="%s" value="%s"/>', idstr, funcstr, evt);
}

function renderState(machine, state)
{
    return sprintf('<td id="state-%s-%s" class="off">&nbsp;<b>%s</b>&nbsp;</td>', machine, state, state);
}



function renderForm(fsmo, config, fakeEvent, fakeInput)
{
    // query some values from the state machine
    var events = fsmo.events();
    var states = fsmo.states();
    var machine = fsmo.identify();

    if(fakeEvent) {
        events.push(fakeEvent);
    }

    var str = '<div class="form">';

    //<input type="button" onclick="$foo.transduce('flip');" value="flip"/>

    str += '<h1>Finite State Machine ID: ' + fsmo.identify() + '</h1>';

    str += renderCompiledFSMButton(machine, machine);
    str += renderStateMachineButton(machine, machine);

    str += '<hr/>';
    str += 'States: ';
    str += '<table class="stateTable"><tr>';
    iterateF(states, function(o) { str += renderState(machine, o); });

    str += '</tr></table>';

    str += '<hr/>';
    str += 'Events: ';

    // render button for real events
    iterateF(events, function(p) { str += renderEvent(machine, p);});

    str += '<hr/>';
    str += 'Inputs: ';
    // render buttons for pairs of logical inputs
    var iospec = config.io;
    var prop, t; // used as temps multiple times hence

    for(prop in iospec) {
        if(iospec[prop] === fsm.logical) {
            str += renderLogicalInput(machine, prop);
        }
    }
    /*
        if(fakeInput) {
          //add a fake input here
          str += renderLogicalInput(machine, fakeInput);
        }
    */
    for(prop in iospec) {
        if(iospec[prop] === fsm.numeric) {
            str += renderNumericInput(machine, prop);
        }
    }

    var problems = [];

    for(prop in iospec) {
        t = iospec[prop];
        if((t !== fsm.logical) && (t !== fsm.numeric)) {
            problems.push(prop);
        }
    }
    if(problems.length) {
        str += '<hr/>';
        str += 'Unsupported inputs (due to type): ';
        str += problems.join("/");
    }

    return  str  + "</div>";

}
