import {sliceConfig as omsSlice}  from "../actions/oms-slice";
import {sliceConfig as localSlice} from "../actions/local-slice";
import {sliceConfig as controlSlice} from "../actions/control-slice";
import {sliceConfig as requestSlice} from "../actions/request-slice";

import {oReduce} from "../utils/oreduce";
import {combineReducers} from "redux";  // todo this is a redux dependency

// reason to combine a console statement has to do with exceptions thrown while just loading a module
// making reading the causing exception completely unreliable in the log until that pattern is fixed
function throwIt(s, err)
{
  const error = err ?? new Error(s);
  // console.error(error);  // guarantee it is reported in the log during loading process
  // alert(s);
  throw(error);
}

// test combined set of slices for unique names, valid slice names, correctness, etc.
function validateAllSlices(allSlices)
{
  const allSliceNames = allSlices.map(({name})=>name);
  const uniqueSliceNames = new Set(allSliceNames);
  if(uniqueSliceNames.size !== allSlices.length)
    throwIt(`Not all slices have unique names (${allSliceNames.join(',')})`);

  const legalSliceNameRegEx = /^[a-z]+[a-zA-Z0-9_]*$/;

  allSliceNames.forEach(name=>{
    const isLegal = legalSliceNameRegEx.test(name)
    if(!isLegal)
      throwIt(`Slice '${name}' does not conform to pattern ${legalSliceNameRegEx.toString()}`)
  });
}


// list of all actions to define
const allSlices = [omsSlice, localSlice, controlSlice,  requestSlice];


let combinedReducers, allCreatorsArr;


validateAllSlices(allSlices);

const createReducer = sliceConfig => {
  const {initialState, reducers} = sliceConfig;

  const funcs = oReduce(Object.entries(reducers), ([k, v]) => [`${sliceConfig.name}/${k}`, v]);

  return function (state = initialState, action) {
    const actionf = funcs[action.type];
    return actionf ? actionf(state, action) : state;
  }
}

const mapOfReducers = oReduce(allSlices, slice => [slice.name, createReducer(slice)]); // take name and reducers as kv pairs for new map

// ==== action processing ====

// where the f is a function replace it with a new function that adds correct type to the created object
const addTypeToCreatorFunction = (k, f) => (...args) => ({type: k, ...f.apply(null, args)});

// creator objects are updated, and then returned as immutable consts (doesn't create a unique object each time, since they are the same)
const addTypeToCreatorObject = (k, v) => {
  const creator = {type: k, ...v};
  return () => creator
};

// an alternate simpler version returns a new object each time, but since they don't change
//const addTypeToCreatorObject = (k, v) => () =>({type:k, ...v});


// given all the slices, we need an array of [{name, unboundActions}] which we will later process into a map of {slicename: boundActions} or slicename.actionName

 allCreatorsArr = allSlices.map(slice => {
  const creators = {...slice.creators};
  // modify each
  Object.entries(creators).forEach(
    ([k, v]) => creators[k] = (typeof v === 'function') ?
      addTypeToCreatorFunction(`${slice.name}/${k}`, v) :
      addTypeToCreatorObject(`${slice.name}/${k}`, v)
  );
  return {name: slice.name, unboundActions: creators};
});

combinedReducers  = combineReducers(mapOfReducers);


// ==== exports ====
export const reducer = combinedReducers;

// this is invoked by actions-integration
export const actionsInit = (bindf)=>oReduce(allCreatorsArr, o=>[o.name,bindf(o.unboundActions)]);
