import * as actionCreators from "../actions/original-creators";

let _actions = undefined;

export const unboundActions = actionCreators;
export const actions = ()=> _actions;
export const actionsInit = (actions)=>_actions = actions;
