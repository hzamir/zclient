import {describeReqId} from "../utils/reqIdGenerator";

interface When {
  'req#': number;
  since: string;
  reqts: string;
  appts: string;
}

interface OpenRequestP {
  type: string;
  url: string;
  reqId: string;
}

interface OpenRequest extends OpenRequestP {
  when: When;
}

interface ResponseMeta {
  reqId: string;
  elapsed: string;
  elapsedMicros: number;
}

interface ErrorMeta extends ResponseMeta {
  name: string;
  message: string;
  stack: string
}

interface ClosedRequest extends OpenRequest {
  elapsed: string;
  elapsedMicros: number;
}


export interface RequestState {
  minisession: number;
  openRequestCount: number;      // tracks number of requests awaiting a response
  closedRequestCount: number;    // tracks requests closed in total
  openRequests: Record<string, OpenRequest>;         // contains a list of requests that have been opened
  closedRequests: ClosedRequest[];       // contains recently closed requests older ones get kicked out, most recently closed first
  maxOpenRequestCount:number;
}

interface OmsInfo { version: string; }
export interface OmsState extends RequestState {
  user: 'yoyo',
  pollInterval: 1_073_741_824, // a big power of two, to start
  omsInfo: OmsInfo,
  parties: Record<any,any>,
  quotes: Record<any,any>,
  trades: Record<any,any>,
}

const initialState:OmsState = {
  minisession: Date.now(),  // this should be changed to format of first part of request id
  openRequestCount: 0,      // tracks number of requests awaiting a response
  closedRequestCount: 0,    // tracks requests closed in total
  openRequests: {},         // contains a list of requests that have been opened
  closedRequests: [],       // contains recently closed requests older ones get kicked out, most recently closed first
  maxOpenRequestCount:0,
  user: 'yoyo',
  pollInterval: 1_073_741_824, // a big power of two, to start
  omsInfo: {version: '*unknown*'},
  parties: {},
  quotes: {},
  trades: {},
};


type OmsCreator = (s:OmsState,...rest: any)=>unknown;
type OmsCreators = Record<string, OmsCreator|{}>;
type OmsReducer = (s:OmsState,...rest: any)=>RequestState|OmsState;
type OmsReducers = Record<string, OmsReducer>;

interface SliceConfig {
  name: string;
  reducers: OmsReducers;
  creators: OmsCreators;
  initialState: OmsState;
}

// generate an accumulator function to use with reduce that maps all object values to a specified keyfield in that value
function rdExtractGenerator(keyField:string)
{
  return function(a:Record<string,any>,v:Record<string,any>){
    const id = v[keyField];
    v.id = id;   // add canonical id field, used by row objects  (todo: temporary antipattern this)
    a[id]=v;
    return a;
  }
}

// generate a reducer that
// accepts a response.data array of objects, reducing it and returning accumulated result in propName
// the reducer takes the keyField, and assigns each value to the key field in the accumulator
function stateProducer(propName:string, keyField:string) {
  const extractorf = rdExtractGenerator(keyField);

  return function(state:any, {response, respMeta}:any) {
    const result = response.data.reduce(extractorf, {});
    const closeRequestChanges = closeRequest(state, respMeta);
    return {...state, [propName]:result, ...closeRequestChanges};
  }
}


// a utility that that implements any action that implies making an api call tracing it to completion
const openRequest = (state:RequestState, {type, reqId, url}:OpenRequestP):RequestState => ({
  ...state,
  openRequestCount: state.openRequestCount+1,
  openRequests: {...state.openRequests, [reqId]: {reqId, type, url, when: describeReqId(reqId)}},
  maxOpenRequestCount: Math.max(state.maxOpenRequestCount, state.openRequestCount+1)
});

// close any request does not return entire state, is folded into other reponses
const closeRequest = (state:RequestState, errorOrResponseMeta: ErrorMeta | ResponseMeta) => {

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


//export const simpleValue = () => (state, action) => ({...state, [action.type]:action.value});


const getter = {get:1};
const noParams = {};
const responseAction = (response:any, respMeta:ResponseMeta)=> ({ response, respMeta});

// leave type parameter out of all the creators it will be added to match the key
// creators can be objects or functions, neither needs to return a type
// functions will be decorated with functions that set the type
// objects will be replaced with objects that have the type set
const creators:OmsCreators = {
  omsVersion:     noParams,

  omsOrderBid:  (symbol:string,party:string,price:any,quantity:any)=> ({ post:'/order/bid', body:{symbol,party,price,quantity}}),
  omsOrderAsk:  (symbol:string,party:string,price:any,quantity:any)=> ({ post:'/order/ask', body:{symbol,party,price,quantity}}),

  omsPartyList:  getter,
  omsQuoteList:    getter,
  omsPartyLookup:  (id:string)=> ({   get:1, tail:id}),
  omsPartyCreate:  (id:string)=> ({  post:1, tail:id}),

  omsTradeList: getter,
  omsTradeListSymbol:          (id:string)=> ({ get:'/trade/list', tail:id}),
  omsTradeListFromTo:          (from:any, to:any)=> ({ get:1, params:{from,to}}),

  // don't absolutely need an error handler for anything, this will catch it
  omsApiCatchAllError:         (errorMeta:ErrorMeta)=> ({ errorMeta}),
  omsVersionError:             (errorMeta:ErrorMeta)=> ({ errorMeta}),

  omsVersionResponse:          responseAction,
  omsPartyListResponse:        responseAction,
  omsQuoteListResponse:        responseAction,
  omsTradeListResponse:        responseAction,

  // omsOrderBidResponse:         responseAction,
  // omsOrderAskResponse:         responseAction,
  // omsPartyLookupResponse:      responseAction,
  // omsPartyCreateResponse:      responseAction,
  // omsTradeListSymbolResponse:  responseAction,
  // omsTradeListFromToResponse:  responseAction,

};

const reducers:OmsReducers = {
  omsVersion:      (state, action)=> openRequest(state, action), // action must have reqId and url set by middleware
  omsOrderBid:     (state, action)=> openRequest(state, action),
  omsOrderAsk:     (state, action)=> openRequest(state, action),
  omsPartyList:    (state, action)=> openRequest(state, action),
  omsPartyLookup:  (state,action)=>openRequest(state, action),
  omsPartyCreate:  (state,action)=>openRequest(state, action),
  omsQuoteList:    (state,action)=>openRequest(state, action),

  omsTradeList:    (state,action)=>openRequest(state, action),
  omsTradeListSymbol:  (state,action)=>openRequest(state, action),
  omsTradeListFromTo:  (state,action)=>openRequest(state, action),

  omsVersionResponse: (state,{response,respMeta})=>({...state, omsInfo:{version:response.data}, ...closeRequest(state,respMeta)}),

  omsApiCatchAllError: (state,{errorMeta})=>({...state, ...closeRequest(state,errorMeta)}),  // todo add error for closing request

  omsVersionError: (state,{errorMeta})=>({...state, ...closeRequest(state,errorMeta)}),  // todo add error for closing request

  // omsOrderBidResponse: (state,{response,respMeta})=>state,
  // omsOrderAskResponse: (state,{response,respMeta})=>state,
  // omsPartyLookupResponse: (state,{response,respMeta})=>state,
  // omsPartyCreateResponse: (state,{response,respMeta})=>state,
  // omsTradeListSymbolResponse:  (state,{response,respMeta})=>state,
  // omsTradeListFromToResponse:  (state,{response,respMeta})=>state,

  omsQuoteListResponse: stateProducer('quotes', 'name'),
  omsTradeListResponse: stateProducer('trades', 'sequence'),
  omsPartyListResponse: stateProducer('parties', 'name'),
};


export const sliceConfig:SliceConfig = {name: "oms", initialState, creators, reducers};


