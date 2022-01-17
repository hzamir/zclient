import * as originalCreators from "../actions/original-creators";
import * as localCreators from "../actions/local-creators";
import {commonKeys} from "../utils/commonKeys";

let _actions = undefined;


// list of all actions to define
const allCreatorsArr = [originalCreators, localCreators];
const actionCreators = allCreatorsArr.reduce((a,v)=>{
  const collisions = commonKeys(a,v);
  if(collisions.length) {
    console.error(`Action Creator collision for at least the following keys`, collisions);
    throw new Error(`Action Creator collision`);
  }
  return {...a, ...v};
}, {})

export const unboundActions = actionCreators;
export const actions = ()=> _actions;
export const actionsInit = (actions)=>_actions = actions;
