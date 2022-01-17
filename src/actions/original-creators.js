export const increment = (counter)=>({type:'Increment', counter});
export const decrement = (counter)=>({type:'Decrement', counter});


function makeActionCreator(type, ...argNames) {
  return function (...args) {
    const action = { type }
    argNames.forEach((arg, index) => {
      action[argNames[index]] = args[index]
    })
    return action
  }
}





export const halveInterval = ()=>({type: halveInterval.name});
export const doubleInterval =()=>({type: doubleInterval.name});



export const omsVersion = ()=> ({type:'omsVersion', get:'/version'});
export const omsOrderBid = (symbol,party,price,quantity)=> ({type:'omsOrderBid', post:'/order/bid', body:{symbol,party,price,quantity}});
export const omsOrderAsk = (symbol,party,price,quantity)=> ({type:'omsOrderAsk', post:'/order/ask', body:{symbol,party,price,quantity}});

export const omsPartyList   = ()=> ({type:'omsPartyList',      get:1});
export const omsPartyLookup = (id)=>({type:'omsPartyLookup',   get:1, tail:id});
export const omsPartyCreate = (id)=> ({type:'omsPartyCreate',  post:1, tail:id});

export const omsQuoteList = (id)=> ({type:'omsQuoteList', get:1});

export const omsTradeList = ()=> ({type:'omsTradeList', get:1});
export const omsTradeListSymbol = (id)=> ({type:'omsTradeListSymbol', get:'/trade/list', tail:id});
export const omsTradeListFromTo = (from,to)=> ({type:'omsTradeListFromTo', get:1, params:{from,to}});

// don't need an error handler for anything, this will catch it
export const omsApiCatchAllError        =  (errorMeta)=> ({type:'omsApiCatchAllError', errorMeta})

export const omsVersionResponse         = (response, respMeta)=> ({type:'omsVersionResponse',  response, respMeta});
export const omsVersionError            = (errorMeta)=> ({type:'omsVersionError', errorMeta});

export const omsOrderBidResponse        = (response, respMeta)=> ({type:'omsOrderBidResponse',        response, respMeta});
export const omsOrderAskResponse        = (response, respMeta)=> ({type:'omsOrderAskResponse',        response, respMeta});
export const omsPartyListResponse       = (response, respMeta)=> ({type:'omsPartyListResponse',       response, respMeta});
export const omsPartyLookupResponse     = (response, respMeta)=> ({type:'omsPartyLookupResponse',     response, respMeta});
export const omsPartyCreateResponse     = (response, respMeta)=> ({type:'omsPartyCreateResponse',     response, respMeta});
export const omsQuoteListResponse       = (response, respMeta)=> ({type:'omsQuoteListResponse',       response, respMeta});
export const omsTradeListResponse       = (response, respMeta)=> ({type:'omsTradeListResponse',       response, respMeta});
export const omsTradeListSymbolResponse = (response, respMeta)=> ({type:'omsTradeListSymbolResponse', response, respMeta});
export const omsTradeListFromToResponse = (response, respMeta)=> ({type:'omsTradeListFromToResponse', response, respMeta});
