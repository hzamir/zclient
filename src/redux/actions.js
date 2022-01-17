import * as originalCreators from "../actions/original-creators";
import * as localCreators from "../actions/local-creators";

let _actions = undefined;

const actionCreators = {...originalCreators, ...localCreators}; // todo at least check for collisions

export const unboundActions = actionCreators;
export const actions = ()=> _actions;
export const actionsInit = (actions)=>_actions = actions;
