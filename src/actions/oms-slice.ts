interface OmsInfo { version: string; }
export interface OmsState {
  user: string;
  omsInfo: OmsInfo;
  parties: Record<any,any>; // these are bad types
  quotes: Record<any,any>;
  trades: Record<any,any>;
}

const initialState:OmsState = {
  user: 'yoyo',
  omsInfo: {version: '*unknown*'},
  parties: {},
  quotes: {},
  trades: {},
};


type OmsCreator = (s:OmsState,...rest: any)=>unknown;
type OmsCreators = Record<string, OmsCreator|{}>;
type OmsReducer = (s:OmsState,...rest: any)=>OmsState;
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
    return {...state, [propName]:result};
  }
}




//export const simpleValue = () => (state, action) => ({...state, [action.type]:action.value});


const getter = {get:1};
const noParams = {};
const responseAction = (response:any)=> ({ response});

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
  omsApiCatchAllError:         noParams,
  omsVersionError:             noParams,

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

const nullReducer = (state:OmsState)=>state;

const reducers:OmsReducers = {
  omsVersion:         nullReducer,  // todo these reducers shouldn't be reachable anyway, middleware replaces them
  omsOrderBid:        nullReducer,
  omsOrderAsk:        nullReducer,
  omsPartyList:       nullReducer,
  omsPartyLookup:     nullReducer,
  omsPartyCreate:     nullReducer,
  omsQuoteList:       nullReducer,

  omsTradeList:       nullReducer,
  omsTradeListSymbol: nullReducer,
  omsTradeListFromTo: nullReducer,

  omsVersionResponse: (state,{response})=>({...state, omsInfo:{version:response.data}}),

  omsApiCatchAllError: (state)=>state,  // let middleware handle this
  omsVersionError: (state)=>state,  // let middleware handle this

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


