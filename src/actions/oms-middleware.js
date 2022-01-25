import axios from 'axios';
import {reqIdGenerate, elapsedSinceReqId} from "../utils/reqIdGenerator";
import {firstArgs} from '../utils/first-args';

const middlestyle = `
    padding: 2px 8px;
    border: 1px solid black;
    background-color:salmon;
    color: black;
    `;


 let omsActions;
 let requestActions;
 let notifyActions;

//  this middleware needs access to other actions
export const omsMiddlewareInit = (actions) =>
{
    omsActions = actions.oms; // there must be an oms slice
    requestActions = actions.request;
    notifyActions = actions.notify;
};


// this should be included in initialization
const baseUrl = 'http://localhost:5000';


const camelCaseRegEx = /([a-z0-9]|(?=[A-Z]))([A-Z])/g;

const slicePrefixLen = 'oms/'.length; // length of sliceName + delimiter
const prefixPlusOmsLen = slicePrefixLen + 'oms'.length; // length of slicePrefix, plus omsPrefix

function omsTypeToPath(atype) {
    const camelCased=atype.slice(prefixPlusOmsLen)
    return camelCased.replace(camelCaseRegEx, '$1/$2').toLowerCase();
    //..todo now this breaks the response mapping somehow
}

function createUrl(action, method) {
    const actMethod = action[method];            // either a string or just truthy value
    const path = (typeof(actMethod) === 'string')? actMethod: omsTypeToPath(action.type);
    const tailPath = action.tail? '/'+action.tail:'';
    return `${baseUrl}${path}${tailPath}`;
}

const axiosConfig = { timeout: 3000 };

const sliceName = 'oms';

// given an an api triggering action, asssign a reqId, and  name of its response and error actions
const calcReqIdAndResponseTypes = aType => {

    return {
     reqId: reqIdGenerate(), // generate a unique request identifier
     rAction: (aType + 'Response').slice(slicePrefixLen), // take off the prefix since we are exporting symbols in flat space no prefix
     eAction: (aType + 'Error').slice(slicePrefixLen),
    }
};

const response = (rAction, reqId, response) => {
    // todo differentiate errorResponses (like non 200 status) and exceptions

    const {elapsedMicros, elapsedStr:elapsed} = elapsedSinceReqId(performance.now(), reqId);

    const respMeta = { reqId, elapsed, elapsedMicros };

    try {
        omsActions[rAction](response, respMeta);
        requestActions.closeRequestR(respMeta);
    } catch(err) {
        console.error(`response action error`, rAction, omsActions);  // the issue is that the actions are not renamed when exported
        throw new Error(`omsActions.${rAction}`);
    }
}


const catchResponse =   (eAction, reqId,  oAction, error)=> {
    const {elapsedMicros, elapsedStr:elapsed} = elapsedSinceReqId(performance.now(), reqId);
    const {name,message,stack} = error;

    // error information includes properties of error, reqId and elapsed time since request was made
    const errorMeta = {name, message, reqId, elapsed, elapsedMicros, stack };

    console.error(`${eAction} reqId:${reqId} exception after: ${elapsed}`, errorMeta);

    // run either specific or generic api error handler
    (omsActions[eAction] ?? omsActions['omsApiCatchAllError'])(errorMeta);
    requestActions.closeRequestE(errorMeta);

    const reqNum = reqId.split('=')[1]; // take part of the request id after the equals sign (with request number)

    // now report it with the original action that created the request to understand the notification better
    notifyActions.error({kind:'Oms', remedy:'Acknowledge', msg: `req#:${reqNum} action: ${oAction} -- ${message}`});
};


// todo better way to make middleware act only on its slice
export const omsMiddleware = store => next => action => {

    const aType = action.type || '';

    const startsWithOms = aType.startsWith(`${sliceName}/`);
    const isResponse = startsWithOms && (aType.endsWith('Response') || aType.endsWith('Error'));  // all errors here are exceptions in this case

    const intercept = startsWithOms && !isResponse;
    if(!intercept)
        return next(action);

    const {reqId, rAction, eAction} = calcReqIdAndResponseTypes(aType);

    const method = action.post? 'post': 'get';
    const url = createUrl(action,method);

    const responsef = firstArgs(response, rAction, reqId);  // determine the reponse function to call
    const catchf    = firstArgs(catchResponse, eAction, reqId, aType);


    console.log(`%c ${aType} sends ${url}`, middlestyle);

    switch(method)
    {
        case 'post':
            axios.post(url, {...action.body}, axiosConfig).then(responsef).catch(catchf);
            break;
        case 'get':
        default:
            if(action.params)
                axios.get(url, {...axiosConfig, params:action.params} ).then(responsef).catch(catchf);
            else
                axios.get(url, axiosConfig).then(responsef).catch(catchf);
    }
    requestActions.openRequest({...action,reqId, url});
    // do not call next, substitute the openRequest action (the close will fail however
   // return next({...action,reqId, url}); // decorate action with reqId and url, actions will record it


};
