export const initialState = {
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
