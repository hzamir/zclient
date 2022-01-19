import {combineReducers} from "redux";
import {oReduce} from "../utils/oreduce";

import {sliceConfig as omsSlice}  from "../actions/oms-slice";
import {sliceConfig as localSlice} from "../actions/local-slice";
import {sliceConfig as controlSlice} from "../actions/control-slice";

const createReducer = sliceConfig => {
  const {initialState, reducers} = sliceConfig;

  const funcs = oReduce(Object.entries(reducers), ([k,v])=>[`${sliceConfig.name}/${k}`, v]);

  return function(state = initialState, action)
  {
    const actionf = funcs[action.type];
    return actionf? actionf(state, action): state;
  }
}

const slices = [omsSlice,localSlice, controlSlice];

// if defining more than one reducer, then combine them here  and return that instead as "reducer"
//const rootReducer = combineReducers({myreducer }); // combining reducers not necessary here

const mapOfReducers = oReduce(slices,slice=>[slice.name,createReducer(slice)]); // take name and reducers as kv pairs for new map

export const reducer = combineReducers(mapOfReducers);
