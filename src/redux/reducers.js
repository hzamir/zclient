import {combineReducers} from "redux";
import {oReduce} from "../utils/oreduce";
import {sliceConfig as originalSlice}  from "../actions/original-slice";
import {sliceConfig as localSlice} from "../actions/local-slice";

const createReducer = sliceConfig => {
  const {initialState, reducers:funcs} = sliceConfig;

  return function(state = initialState, action)
  {
    const actionf = funcs[action.type];
    return actionf? actionf(state, action): state;
  }
}

const slices = [originalSlice,localSlice];

// if defining more than one reducer, then combine them here  and return that instead as "reducer"
//const rootReducer = combineReducers({myreducer }); // combining reducers not necessary here

const mapOfReducers = oReduce(slices,slice=>[slice.name,createReducer(slice)]); // take name and reducers as kv pairs for new map

export const reducer = combineReducers(mapOfReducers);
