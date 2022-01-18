import {sliceConfig as originalSlice}  from "../actions/original-slice";
import {sliceConfig as localSlice} from "../actions/local-slice";

// import { createSlice, PayloadAction } from '@reduxjs/toolkit'

import {commonKeys} from "../utils/commonKeys";

let _actions = undefined;

// where the f is a function replace it with a new function that adds correct type to the created object
const addTypeToCreatorFunction = (k, f) => (...args) =>({type: k, ...f.apply(null,args)});

// creator objects are updated, and then returned as immutable consts (doesn't create a unique object each time, since they are the same)
const addTypeToCreatorObject = (k, v) =>{ const creator = {type: k, ...v}; return () => creator };

// an alternate simpler version returns a new object each time, but since they don't change
//const addTypeToCreatorObject = (k, v) => () =>({type:k, ...v});


// list of all actions to define
const allCreatorsArr = [originalSlice.creators, localSlice.creators];

allCreatorsArr.forEach(creators=>{
  // modify each
  Object.entries(creators).forEach(
  ([k,v])=>creators[k] = (typeof v === 'function')? addTypeToCreatorFunction(k,v): addTypeToCreatorObject(k,v));
})

const actionCreators = allCreatorsArr.reduce((a,v)=>{
  const collisions = commonKeys(a,v);
  if(collisions.length) {
    console.error(`Action Creator collision for at least the following keys`, collisions);
    throw new Error(`Action Creator collision`);
  }
  return {...a, ...v};
}, {})



// const actionCreators = allCreatorsArr.reduce((a,v)=>{
//   const collisions = commonKeys(a,v);
//   if(collisions.length) {
//     console.error(`Action Creator collision for at least the following keys`, collisions);
//     throw new Error(`Action Creator collision`);
//   }
//   return {...a, ...v};
// }, {})

export const unboundActions = actionCreators;
export const actions = ()=> _actions;
export const actionsInit = (actions)=>_actions = actions;
