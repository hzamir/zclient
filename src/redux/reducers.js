import {initialState} from "../constants/initial-state";
import * as funcs from "./action-funcs";

const actionstyle = `
    padding: 2px 8px;
    border: 1px solid black;
    background-color:plum;
    color: black;
    `;

function onlyReducerYouWillEverNeed(state = initialState, action) {
  console.log(`%c +action - ${action.type}`, actionstyle, action);
  const actionf = funcs[action.type];
  return actionf? actionf(state, action): state;
}

// if defining more than one reducer, then combine them here  and return that instead as "reducer"
//const rootReducer = combineReducers({myreducer }); // combining reducers not necessary here


export const reducer = onlyReducerYouWillEverNeed;
