import {describeReqId} from "../utils/reqIdGenerator";


const initialState = {
  minisession: Date.now(),  // this should be changed to format of first part of request id
  openRequestCount: 0,      // tracks number of requests awaiting a response
  closedRequestCount: 0,    // tracks requests closed in total
  openRequests: {},         // contains a list of requests that have been opened
  closedRequests: [],       // contains recently closed requests older ones get kicked out, most recently closed first
  maxOpenRequestCount:0,
  acounter: 0,
  bcounter: 0,
  user: 'yoyo',
  gridChoice: 'Trades',
  pollInterval: 1_073_741_824, // a big power of two, to start
  omsInfo: {version: '*unknown*'},
  parties: {},
  quotes: {},
  trades: {},
  layout: {left:100, right:100}
};


// generate an accumulator function to use with reduce that maps all object values to a specified keyfield in that value
function rdExtractGenerator(keyField)
{
  return function(a,v){
    const id = v[keyField];
    v.id = id;   // add canonical id field, used by row objects  (todo: temporary antipattern this)
    a[id]=v;
    return a;
  }
}

// generate a reducer that
// accepts a response.data array of objects, reducing it and returning accumulated result in propName
// the reducer takes the keyField, and assigns each value to the key field in the accumulator
function stateProducer(propName, keyField) {
  const extractorf = rdExtractGenerator(keyField);

  return function(state, {response, respMeta}) {
    const result = response.data.reduce(extractorf, {});
    const closeRequestChanges = closeRequest(state, respMeta);
    return {...state, [propName]:result, ...closeRequestChanges};
  }
}

// a utility that that implements any action that implies making an api call tracing it to completion
const openRequest = (state, {type, reqId, url}) => ({
  ...state,
  openRequestCount: state.openRequestCount+1,
  openRequests: {...state.openRequests, [reqId]: {type, url, when: describeReqId(reqId)}},
  maxOpenRequestCount: Math.max(state.maxOpenRequestCount, state.openRequestCount+1)
});

// close any request does not return entire state, is folded into other reponses
const closeRequest = (state, errorOrResponseMeta) => {

  const { reqId, elapsed, elapsedMicros, name=undefined, message=undefined, stack=undefined} = errorOrResponseMeta;

  //...todo check for Error or no need when closedRequests changes and contents contain error info
  const {[reqId]:closing = null,...allOtherRequests} = state.openRequests;

  const openRequestCount = state.openRequestCount - (closing?  1: 0); // in case somehow redundantly closed (bad identifiers, double response)
  const addToClosed = {
    ...(message && {errorInfo:{name,message,stack}})  // idiom to conditionally add errorInfo if it is an error
  };

  // add to closed Requests, but keep limited number of them
  const closedRequests = closing? [{reqId, elapsed, elapsedMicros,...closing, ...addToClosed}, ...state.closedRequests].slice(0, 10) : state.closedRequests;
  const closedRequestCount = state.closedRequestCount + (closing? 1: 0);

  return {openRequestCount, openRequests: {...allOtherRequests}, closedRequests, closedRequestCount };
};


//export const simpleValue = () => (state, action) => ({...state, [action.type]:action.value});



const reducers = {
  Increment: (state, {counter}) =>
  {
    const val = state[counter] + 1;
    return  {...state, [counter]:val}
  },

  Decrement: (state, {counter}) =>
  {
    const val = state[counter] - 1;
    return  {...state, [counter]:val}
  },
  halveInterval: s =>{
    let {pollInterval: iv} =s;
    iv = iv < 50? iv: iv * 0.5;
    return {...s, pollInterval: iv};
  },
  doubleInterval: s =>{
    let {pollInterval: iv} = s;
    iv = iv > 100_000_000? iv: iv * 2;
    return {...s, pollInterval: iv};
  },

  omsVersion:  (state, action)=> openRequest(state, action), // action must have reqId and url set by middleware

  omsOrderBid:  (state, action)=> openRequest(state, action),
  omsOrderAsk:  (state, action)=> openRequest(state, action),
  omsPartyList: (state, action)=> openRequest(state, action),
  omsPartyLookup:  (state,action)=>openRequest(state, action),
  omsPartyCreate:  (state,action)=>openRequest(state, action),

  omsQuoteList:  (state,action)=>openRequest(state, action),

  omsTradeList:  (state,action)=>openRequest(state, action),
  omsTradeListSymbol:  (state,action)=>openRequest(state, action),
  omsTradeListFromTo:  (state,action)=>openRequest(state, action),

  omsVersionResponse: (state,{response,respMeta})=>({...state, omsInfo:{version:response.data}, ...closeRequest(state,respMeta)}),

  omsApiCatchAllError: (state,{errorMeta})=>({...state, ...closeRequest(state,errorMeta)}),  // todo add error for closing request

  omsVersionError: (state,{errorMeta})=>({...state, ...closeRequest(state,errorMeta)}),  // todo add error for closing request
  omsOrderBidResponse: (state,{response,respMeta})=>state,
  omsOrderAskResponse: (state,{response,respMeta})=>state,
  omsPartyLookupResponse: (state,{response,respMeta})=>state,
  omsPartyCreateResponse: (state,{response,respMeta})=>state,
  omsTradeListSymbolResponse:  (state,{response,respMeta})=>state,
  omsTradeListFromToResponse:  (state,{response,respMeta})=>state,



  omsQuoteListResponse: stateProducer('quotes', 'name'),
  omsTradeListResponse: stateProducer('trades', 'sequence'),
  omsPartyListResponse: stateProducer('parties', 'name'),

  pickGrid:  (state, {value})=>({...state, gridChoice:value}),
  toggleLeft: (state, {expanded})=>({...state, layout: {...state.layout, left: state.layout.left? 0: expanded}}),
  toggleRight: (state, {expanded})=>({...state, layout: {...state.layout, right: state.layout.right? 0: expanded}}),

};


export const sliceConfig = {name: "original", initialState, reducers};


