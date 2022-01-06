import {initialState} from "./constants/initial-state";
import * as funcs from "./action-funcs";
import {applyMiddleware, bindActionCreators, combineReducers, createStore} from "redux";
import {composeWithDevTools} from "redux-devtools-extension";
import {getMiddleware, init} from "./example-redux-middleware";
import * as actionCreators from "./action-creators";
import {connect, Provider} from "react-redux";
import App from "./App";
import {render} from "react-dom";
import React from "react";

import { selectors } from "./redux/selectors";

import './index.css';

const actionstyle = `
    padding: 2px 8px;
    border: 1px solid black;
    background-color:plum;
    color: black;
    `;

function myreducer(state = initialState, action) {
  console.log(`%c +action - ${action.type}`, actionstyle, action);
  const actionf = funcs[action.type];
  return actionf? actionf(state,action): state;
}

const rootReducer = combineReducers({myreducer });

const store = createStore(
  rootReducer,
  composeWithDevTools(
    applyMiddleware(getMiddleware)
  )
);


const mapStateToProps = state => {
  return {...state.myreducer, ...selectors(state.myreducer), xyz:1};
};


const mapDispatchToProps = dispatch => {
  const actions =  bindActionCreators(actionCreators, dispatch);
  init(actions);
  return { actions}
};

const ConnectedApp =  connect(
  mapStateToProps,
  mapDispatchToProps,
  null,
  { forwardRef: true } // must be supplied for react/redux when using Ag-Grid GridOptions.reactNext

)(App);


export function connectApp()
{
  render(
    <Provider store={store}>
      <ConnectedApp/>
    </Provider>,
    document.getElementById('root')
  );
}

