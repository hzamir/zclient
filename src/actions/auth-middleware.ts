import axios from 'axios';
import {reqIdGenerate, elapsedSinceReqId} from "../utils/reqIdGenerator";
import {firstArgs} from '../utils/first-args';
import {Action, ErrorMeta, ResponseMeta} from '../actions-integration/types'
import {sliceConfig, AuthAction} from './auth-slice'  // bring in its actions, and types

//local minimal type definitions to squeak through in ts




// next function is basically just a dispatch continuation
// bound action works the same way
type BoundAction = (a:Action)=>unknown;
type NextF = BoundAction;

//=====================================================
const middlestyle = `
    padding: 2px 8px;
    border: 1px solid black;
    background-color: #7DD;
    color: black;
    `;

let authActions:any;
let requestActions:any;


//  this middleware needs access to other actions
export const authMiddlewareInit = (actions:any) =>
{
  authActions = actions.auth; // there must be an auth slice
  requestActions = actions.request;
};



const camelCaseRegEx = /([a-z0-9]|(?=[A-Z]))([A-Z])/g;

const typeToPath = (tType:string) => tType.replace(camelCaseRegEx, '$1/$2').toLowerCase();


function createUrl(tType:string, action:AuthAction) {
  // todo inject specific domains for environment here
  const subdomain   = tType === 'refresh'? 'auth': 'appdev'; //
  const apiCategory = tType === 'refresh'? 'jwt': 'v1/auth';
  const specificApi = typeToPath(tType);
  const tailPath = action.tail? '/'+action.tail:'';

  return `https://${subdomain}.prometheusalts.com/api/${apiCategory}/${specificApi}${tailPath}`
}

const axiosConfig = { timeout: 30000 };



const createErrorMeta = (reqId:string, error:Error):ErrorMeta => {

  const {elapsedMicros, elapsedStr:elapsed} = elapsedSinceReqId(performance.now(), reqId);
  const {name,message,stack} = error;

  // error information includes properties of error, reqId and elapsed time since request was made
 return {name, message, reqId, elapsed, elapsedMicros, stack };

}

// given an an api triggering action, asssign a reqId, and  name of its response and error actions
const calcReqIdAndResponseTypes = (tType:string) => {
  return {
    reqId: reqIdGenerate(), // generate a unique request identifier
    rAction: (tType + 'Response'),  // take off the prefix since we are exporting symbols in flat space no prefix
    reAction: (tType + 'Error'),    // error responses coming from api (like non-200 values)
    eAction: (tType + 'Exception'), // request level exceptions
  }
};

const response = (rAction:string, reAction:string, reqId:string, response:any) => {
  // todo differentiate errorResponses (like non 200 status) and exceptions

  const {elapsedMicros, elapsedStr:elapsed} = elapsedSinceReqId(performance.now(), reqId);

  const respMeta:ResponseMeta = { reqId, elapsed, elapsedMicros };

  try {
    if(response.status !== 200) {
      // error information includes properties of error, reqId and elapsed time since request was made
      const errorMeta = createErrorMeta(reqId, {name:'', stack: '', message: response.statusText});
      console.error(`${reAction} reqId:${reqId} api returns error after: ${elapsed}`, errorMeta);

      // run either specific or generic api error handler
      (authActions[reAction] ?? authActions['authApiCatchAllError'])(errorMeta);
      requestActions.closeRequestE(errorMeta);
    } else {
      authActions[rAction](response, respMeta);
      requestActions.closeRequestR(respMeta);
    }

  } catch(err) {
    console.error(`response action error`, rAction, authActions);  // the issue is that the actions are not renamed when exported
    throw new Error(`authActions.${rAction}`);
  }
}

const catchResponse =   (eAction:string, reqId:string,  error:Error)=> {
  const {elapsedMicros, elapsedStr:elapsed} = elapsedSinceReqId(performance.now(), reqId);
  const {name,message,stack} = error;

  // error information includes properties of error, reqId and elapsed time since request was made
  const errorMeta = {name, message, reqId, elapsed, elapsedMicros, stack };

  console.error(`${eAction} reqId:${reqId} exception after: ${elapsed}`, errorMeta);

  // run either specific or generic api error handler
  (authActions[eAction] ?? authActions['authApiCatchAllException'])(errorMeta);
  requestActions.closeRequestE(errorMeta);
};

type ResponseF = (response:any)=>unknown;
type CatchF    = (e:Error)=>unknown;


// read name of action, for now all actions in our slice trigger api calls that are not responses or errors mapped to their
// results

const triggersApi = (aType:string, sliceName:string) =>
  aType.startsWith(`${sliceName}/`) &&
  !(aType.endsWith('Response') || aType.endsWith('Error') || aType.endsWith('Exception'))

// todo better way to make middleware act only on its slice
export const authMiddleware = (store:any) => (next:NextF) => (a:Action) => {

  const aType = a.type || '';  // really it should be a fatal error to have no type, but not our problem

  const intercept = triggersApi(aType, sliceConfig.name);
  if(!intercept)
    return next(a);

  const tType = aType.slice(sliceConfig.name.length + 1);
  const {reqId, rAction, reAction, eAction} = calcReqIdAndResponseTypes(tType);

  // from this point on it is an authAction, meaning it must have a reqId
  const action: AuthAction = a as AuthAction;
  const responsef = firstArgs(response, rAction, reAction, reqId);  // determine the reponse function to call
  const catchf    = firstArgs(catchResponse, eAction, reqId);

  const url = createUrl(tType, action);

  console.log(`%c ${aType} sends ${url}`, middlestyle);

  axios.post(url, {...action.body}, axiosConfig).then(responsef).catch(catchf);
  requestActions.openRequest({...action,reqId, url});
  // do not call next, substitute the openRequest action (the close will fail however
  // return next({...action,reqId, url}); // decorate action with reqId and url, actions will record it


};
