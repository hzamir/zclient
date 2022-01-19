import {sliceConfig as originalSlice}  from "../actions/original-slice";
import {sliceConfig as localSlice} from "../actions/local-slice";
import {sliceConfig as controlSlice} from "../actions/control-slice";

import {oReduce} from "../utils/oreduce";

// where the f is a function replace it with a new function that adds correct type to the created object
const addTypeToCreatorFunction = (k, f) => (...args) =>({type: k, ...f.apply(null, args)});

// creator objects are updated, and then returned as immutable consts (doesn't create a unique object each time, since they are the same)
const addTypeToCreatorObject = (k, v) =>{ const creator = {type: k, ...v}; return () => creator };

// an alternate simpler version returns a new object each time, but since they don't change
//const addTypeToCreatorObject = (k, v) => () =>({type:k, ...v});


// list of all actions to define
const allSlices = [originalSlice, localSlice, controlSlice];

// given all the slices, we need an array of [{name, unboundActions}] which we will later process into a map of {slicename: boundActions} or slicename.actionName

const allCreatorsArr = allSlices.map(slice=>{
  const creators = {...slice.creators};
  // modify each
  Object.entries(creators).forEach(
    ([k,v])=>creators[k] = (typeof v === 'function')?
    addTypeToCreatorFunction(`${slice.name}/${k}`,v):
    addTypeToCreatorObject(`${slice.name}/${k}`, v)
  );
  return {name: slice.name, unboundActions:creators};
});

// this is invoked by actions-integration
export const actionsInit = (bindf)=>oReduce(allCreatorsArr, o=>[o.name,bindf(o.unboundActions)]);
