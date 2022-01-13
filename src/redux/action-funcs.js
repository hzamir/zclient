import {describeReqId} from "../utils/reqIdGenerator";

export function Increment(state, {counter})
{
    const val = state[counter] + 1;
    return  {...state, [counter]:val}
}

export function Decrement(state, {counter})
{
    const val = state[counter] - 1;
    return  {...state, [counter]:val}
}


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

export const omsVersion = (state, action)=> openRequest(state, action); // action must have reqId and url set by middleware

export const omsOrderBid = (state, action)=> openRequest(state, action);
export const omsOrderAsk = (state, action)=> openRequest(state, action);
export const omsPartyList   = (state, action)=> openRequest(state, action);
export const omsPartyLookup = (state,action)=>openRequest(state, action);
export const omsPartyCreate = (state,action)=>openRequest(state, action);

export const omsQuoteList = (state,action)=>openRequest(state, action);

export const omsTradeList = (state,action)=>openRequest(state, action);
export const omsTradeListSymbol = (state,action)=>openRequest(state, action);
export const omsTradeListFromTo = (state,action)=>openRequest(state, action);

export const omsVersionResponse         = (state,{response,respMeta})=>({...state, omsInfo:{version:response.data}, ...closeRequest(state,respMeta)});
export const omsVersionError            = (state,{errorMeta})=>({...state, ...closeRequest(state,errorMeta)});  // todo add error for closing request
export const omsOrderBidResponse        = (state,{response,respMeta})=>state;
export const omsOrderAskResponse        = (state,{response,respMeta})=>state;
export const omsPartyLookupResponse     = (state,{response,respMeta})=>state;
export const omsPartyCreateResponse     = (state,{response,respMeta})=>state;
export const omsTradeListSymbolResponse = (state,{response,respMeta})=>state;
export const omsTradeListFromToResponse = (state,{response,respMeta})=>state;

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

export const simpleValue = () => (state, action) => ({...state, [action.type]:action.value});

export const omsQuoteListResponse       = stateProducer('quotes', 'name');
export const omsTradeListResponse       = stateProducer('trades', 'sequence');
export const omsPartyListResponse       = stateProducer('parties', 'name');

export const pickGrid = (state, {value})=>({...state, gridChoice:value});
export const toggleLeft =(state, {expanded})=>({...state, layout: {...state.layout, left: state.layout.left? 0: expanded}});
export const toggleRight =(state, {expanded})=>({...state, layout: {...state.layout, right: state.layout.right? 0: expanded}});
