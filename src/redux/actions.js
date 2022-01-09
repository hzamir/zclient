import * as actionCreators from "./action-creators";

let _actions = undefined;

export const unboundActions = actionCreators;
export const actions = ()=> _actions;
export const actionsInit = (actions)=>_actions = actions;
