import {describeReqId, minisession} from "../utils/reqIdGenerator";

interface When {
  'req#': number;
  since: string;
  reqts: string;
  appts: string;
}

export interface OpenRequestP {
  type: string;
  url: string;
  reqId: string;
}

export interface OpenRequest extends OpenRequestP {
  when: When;
}

export interface ResponseMeta {
  reqId: string;
  elapsed: string;
  elapsedMicros: number;
}

export interface ErrorMeta extends ResponseMeta {
  name: string;
  message: string;
  stack: string
}

export interface ClosedRequest extends OpenRequest {
  elapsed: string;
  elapsedMicros: number;
}


export interface RequestState {
  minisession: typeof minisession;  // whatever type the imported minisession constant is
  openRequestCount: number;         // tracks number of requests awaiting a response
  closedRequestCount: number;       // tracks requests closed in total
  maxOpenRequestCount:number;
  openRequests: Record<string, OpenRequest>;         // contains a list of requests that have been opened
  closedRequests: ClosedRequest[];       // contains recently closed requests older ones get kicked out, most recently closed first
}

export const initialState:RequestState = {
  minisession,  // this should be changed to format of first part of request id
  openRequestCount: 0,      // tracks number of requests awaiting a response
  closedRequestCount: 0,    // tracks requests closed in total
  maxOpenRequestCount:0,
  openRequests: {},         // contains a list of requests that have been opened
  closedRequests: [],       // contains recently closed requests older ones get kicked out, most recently closed first
};



// a utility that that implements any action that implies making an api call tracing it to completion
export const openRequest = (state:RequestState, {type, reqId, url}:OpenRequestP):RequestState => ({
  ...state,
  openRequestCount: state.openRequestCount+1,
  openRequests: {...state.openRequests, [reqId]: {reqId, type, url, when: describeReqId(reqId)}},
  maxOpenRequestCount: Math.max(state.maxOpenRequestCount, state.openRequestCount+1)
});

// close any request does not return entire state, is folded into other reponses
export const closeRequest = (state:RequestState, errorOrResponseMeta: ErrorMeta | ResponseMeta) => {

  const { reqId, elapsed, elapsedMicros, name=undefined, message=undefined, stack=undefined} = errorOrResponseMeta as any; // any here simplfies

  //...todo check for Error or no need when closedRequests changes and contents contain error info
  const {[reqId]:closing = null,...allOtherRequests} = state.openRequests;

  const openRequestCount = state.openRequestCount - (closing?  1: 0); // in case somehow redundantly closed (bad identifiers, double response)
  const addToClosed = {
    ...(message && {errorInfo:{name,message,stack}})  // idiom to conditionally add errorInfo if it is an error
  };

  // add to closed Requests, but keep limited number of them
  const closedRequests:ClosedRequest[] = closing? [{elapsed, elapsedMicros,...closing, ...addToClosed}, ...state.closedRequests].slice(0, 10) : state.closedRequests;
  const closedRequestCount = state.closedRequestCount + (closing? 1: 0);

  return {openRequestCount, openRequests: {...allOtherRequests}, closedRequests, closedRequestCount };
};
