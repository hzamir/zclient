import {fsm, FsmFactory} from "./fizbin";

function say(s,p,id) {
    console.warn(`State/enter ${id}, current ${s} <-prev: ${p}`);
}
function said(s,n,id) {
    console.warn(`State/exit ${id}, current: ${s} ->next: ${n}`);
}


function SecurityLight(id)
{
    this.fsm = SecurityLight.factory.create(id, this);  // create an fsm instance
}
SecurityLight.factorize = function() {SecurityLight.factory = new FsmFactory(SecurityLight); };
SecurityLight.prototype = {
    constructor: SecurityLight
    ,enter: say  // generic state entry logging
    ,exit: said  // generic state exit logging
    // ,enterOn: function() { log('I am on');  }
    // ,exitOn: function()  { log('I am off'); }
};

SecurityLight.config =
    {
        start:   'Night'                     // initial state
        ,states: ['Day', 'Night', 'On']     // our set of states

        //---- io section defines signals (events are still union of those mentioned in transitions) ----
        ,io:
            {
                ambientLight: fsm.logical,
                temperature: fsm.numeric
            }

        // all the possible ways to get from one state to another
        ,transitions:
            [
                {from: 'Day',   to: 'Night', when:'! ambientLight'}
                ,{from: 'Night', to: 'Day',   when: 'ambientLight'}
                ,{from: 'Night', to: 'On',    evt: 'motion'}
                ,{from: 'On',    to: 'On',    evt: 'motion'}                       // reaction (input action?)
                ,{from: 'On',    to: 'Night', timer:5000 }  // timer uses after
                ,{from: 'On',    to: 'Day',   when:'ambientLight'}
                //    ,{from: '*', to:'On', when: 'temperature > 100'}

            ]

        ,options:{}
    };


SecurityLight.factorize();
const t = new SecurityLight('seclight-1');
export const seclightFsm = t.fsm;
