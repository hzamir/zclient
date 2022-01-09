// first define a single store, and apply all middlewares
import {bindActionCreators, createStore} from "redux";
import {reducer} from "./reducers";
import {composeWithDevTools} from "redux-devtools-extension";
import {middlewares, middlewaresInit} from "./middlewares";
import {actionsInit, unboundActions} from "./actions";
import {render} from "react-dom";
import {Provider} from "react-redux";


import React from "react";

const store = createStore(reducer, composeWithDevTools(middlewares));

// bind all actions and make them available to middleware
const actions = bindActionCreators(unboundActions, store.dispatch);

Object.freeze(actions);

actionsInit(actions);
middlewaresInit(actions); // our middleware needs access to actions

export function connectRootComponent(WrappedComponent: React.ComponentType) {
  // Creating the inner component. The calculated Props type here is the where the magic happens.
  const component = () => <Provider store={store}><WrappedComponent/></Provider>;
  component.displayName = `ReduxConnected(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return component;
}
