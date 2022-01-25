import axios from 'axios';
import {reqIdGenerate, elapsedSinceReqId} from "../utils/reqIdGenerator";
import {firstArgs} from '../utils/first-args';
import {Action, NextF, ErrorMeta, ResponseMeta} from '../actions-integration/types'
import {sliceConfig, AuthAction, Claims} from './auth-slice'
import {PNoticeNoKey } from './notify-slice';

import {decode} from '../utils/decode-jwt';  // bring in its actions, and types



// todo move these to configuration
const millisToRefreshPriorToExpiration = 78_000;
const minimumMillisThatMustBeGrantedByFreshToken = 60_000; //millisToRefreshPriorToExpiration * 1.5; // we won't play ball with less than this
const httpTimeoutPatience = 30_000; // must be long enough for all auth. and appdev/auth requests
//=====================================================
const middlestyle = `
    padding: 2px 8px;
    border: 1px solid black;
    background-color: #7DD;
    color: black;
    `;

let authActions:any;
let requestActions:any;
let notifyActions:any;


//  this middleware needs access to other actions
export const authMiddlewareInit = (actions:any) =>
{
  authActions = actions.auth; // there must be an auth slice
  requestActions = actions.request;
  notifyActions = actions.notify;
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

// validate all statuses for now, to differentiate between exceptions and errors
// might have to tighten this up, depending on which status will not have any error details
const axiosConfig = { timeout: httpTimeoutPatience, validateStatus: (status:number)=>true};

const note = (reqId:string, aType:string, msg:string): PNoticeNoKey => {

  const reqNum = reqId.split('=')[1]; // take part of the request id after the equals sign (with request number)

  return  {
    msg:`req#:${reqNum} action: ${aType} -- ${msg}`,
    kind: 'Authentication',
    remedy: 'Acknowledge'
  }
}
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

const resolvedResponse = (rAction:string, reAction:string, reqId:string, response:any) => {
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
      notifyActions.warn(note(reqId,rAction, errorMeta.message))

    } else {
      authActions[rAction](response, respMeta);
      requestActions.closeRequestR(respMeta);
      possibleRefreshTrigger(rAction, response);
    }

  } catch(err:any) {
    // something that just should not happen ever should trigger a fatal notification
    const msg = `response action error '${rAction}' either doesn't exist or it throws an exception, msg=${err.message}`;
    notifyActions.fatal(note(reqId,rAction, msg));
    throw(err); // rethrow for stack sake?
  }
}

const catchResponse =   (eAction:string, reqId:string,  error:Error)=> {
  const {elapsedMicros, elapsedStr:elapsed} = elapsedSinceReqId(performance.now(), reqId);
  const {name,message,stack} = error;

  // error information includes properties of error, reqId and elapsed time since request was made
  const errorMeta = {name, message, reqId, elapsed, elapsedMicros, stack };

  const errMsg = `${eAction} reqId:${reqId} api triggers exception after: ${elapsed}`
  console.error(errMsg, errorMeta);

  // run either specific or generic api error handler
  (authActions[eAction] ?? authActions['authApiCatchAllException'])(errorMeta);
  requestActions.closeRequestE(errorMeta);
  notifyActions.error(note(reqId,eAction, errorMeta.message))
};

// type ResponseF = (response:any)=>unknown;
// type CatchF    = (e:Error)=>unknown;


// read name of action, for now all actions in our slice trigger api calls that are not responses or errors mapped to their
// results

let refreshTimer:ReturnType<typeof setTimeout>;

// we can pulll
const possibleRefreshTrigger = (rType:string, resp:any) => {
  if(rType === 'refreshResponse' || rType === 'loginResponse') {
    if(resp.status === 200) {
      const accessToken = rType === 'refreshResponse'? resp.data.token: resp.data.accessToken;
      const {exp} = decode(accessToken) as Claims;
      const millisFromNow:number = (exp*1000 - Date.now());

      if(millisFromNow > minimumMillisThatMustBeGrantedByFreshToken) {
        const refreshToken = resp.data.refreshToken;
        clearTimeout(refreshTimer);
        refreshTimer = setTimeout(() => authActions.refresh(refreshToken), millisFromNow - millisToRefreshPriorToExpiration);
      } else {
        const note: PNoticeNoKey = {
          msg:`Refresh token just received good for only ${millisFromNow} millis`,
          kind: 'unexpected',
          remedy: 'Nothing'
        }
        notifyActions.fatal(note)

      }
    } else {


    }

    }
}


const triggersApi = (aType:string, sliceName:string) =>
  aType.startsWith(`${sliceName}/`) &&
  !(aType.endsWith('Response') || aType.endsWith('Error') || aType.endsWith('Exception'))

// todo better way to make middleware act only on its slice
export const authMiddleware = (/*store:any*/) => (next:NextF) => (a:Action) => {

  const aType = a.type || '';  // really it should be a fatal error to have no type, but not our problem

  const intercept = triggersApi(aType, sliceConfig.name);
  if(!intercept)
    return next(a);

  const tType = aType.slice(sliceConfig.name.length + 1);
  const {reqId, rAction, reAction, eAction} = calcReqIdAndResponseTypes(tType);

  // from this point on it is an authAction, meaning it must have a reqId
  const action: AuthAction = a as AuthAction;
  const responsef = firstArgs(resolvedResponse, rAction, reAction, reqId);  // determine the reponse function to call
  const catchf    = firstArgs(catchResponse, eAction, reqId);

  const url = createUrl(tType, action);

  console.log(`%c ${aType} sends ${url}`, middlestyle);

  axios.post(url, {...action.body}, axiosConfig).then(responsef).catch(catchf);
  requestActions.openRequest({...action,reqId, url});
  // do not call next, substitute the openRequest action (the close will fail however
  // return next({...action,reqId, url}); // decorate action with reqId and url, actions will record it


};
