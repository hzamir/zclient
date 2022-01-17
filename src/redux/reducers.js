import {sliceConfig as originalSlice}  from "../actions/original-slice";


const createReducer = sliceConfig => {
  const {initialState, reducers:funcs} = sliceConfig;

  return function(state = initialState, action)
  {
    const actionf = funcs[action.type];
    return actionf? actionf(state, action): state;
  }
}


// if defining more than one reducer, then combine them here  and return that instead as "reducer"
//const rootReducer = combineReducers({myreducer }); // combining reducers not necessary here


export const reducer = createReducer(originalSlice);
