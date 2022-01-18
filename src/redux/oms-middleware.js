import axios from 'axios';
import {reqIdGenerate, elapsedSinceReqId} from "../utils/reqIdGenerator";

const middlestyle = `
    padding: 2px 8px;
    border: 1px solid black;
    background-color:salmon;
    color: black;
    `;

let _actions = undefined;

//  we will need to launch actions on API returns
export const init = (actions) =>
{
    _actions = actions;
};

export const crementMiddleWare = store => next => action => {
    const aType = action.type || '';

    if(aType.endsWith('crement'))
    {
        console.log(`%c ${aType}`, middlestyle);
    }

    next(action);
};



const baseUrl = 'http://localhost:5000';


const camelCaseRegEx = /([a-z0-9]|(?=[A-Z]))([A-Z])/g;
function omsTypeToPath(atype) {
    const camelCased=atype.slice(3); // remove first three letters
    return camelCased.replace(camelCaseRegEx, '$1/$2').toLowerCase();
}

function createUrl(action, method) {
    const actMethod = action[method];            // either a string or just truthy value
    const path = (typeof(actMethod) === 'string')? actMethod: omsTypeToPath(action.type);
    const tailPath = action.tail? '/'+action.tail:'';
    return `${baseUrl}${path}${tailPath}`;
}

const axiosConfig = { timeout: 1000 };

export const omsMiddleware = store => next => action => {

    const aType = action.type || '';

    const startsWithOms = aType.startsWith('oms');
    const isResponse = startsWithOms && (aType.endsWith('Response') || aType.endsWith('Error'));  // all errors here are exceptions in this case
    //
    let reqId;

    if(startsWithOms && !isResponse)
    {
        const reqId = reqIdGenerate(); // generate a unique request identifier

        const rAction = aType+'Response';
        const eAction = aType+'Error';

        const responsef = (response)=> {

            // todo differentiate errorResponses (like non 200 status) and exceptions

            const {elapsedMicros, elapsedStr:elapsed} = elapsedSinceReqId(performance.now(), reqId);

            const respMeta = { reqId, elapsed, elapsedMicros };
            _actions[rAction](response, respMeta);


        }
        const catchf    = (error)=> {
            const {elapsedMicros, elapsedStr:elapsed} = elapsedSinceReqId(performance.now(), reqId);
            const {name,message,stack} = error;

            // error information includes properties of error, reqId and elapsed time since request was made
            const errorMeta = {name, message, reqId, elapsed, elapsedMicros, stack };

            console.error(`${eAction} reqId:${reqId} exception after: ${elapsed}`, errorMeta);

            // run either specific or generic api error handler

            (_actions[eAction] ?? _actions['omsApiCatchAllError'])(errorMeta);
        };

        const method = action.post? 'post': 'get';
        const url = createUrl(action,method);

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
        return next({...action,reqId, url}); // decorate action with reqId and url, actions will record it
    }

    return next(action);
};
