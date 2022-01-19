import {AnyAction, bindActionCreators, createStore, applyMiddleware, Dispatch} from "redux";
import {composeWithDevTools} from "redux-devtools-extension";
import { Provider, useSelector as reduxUseSelector } from "react-redux";


import {reducer} from "../redux/reducers";
import {actionsInit} from "../redux/actions";


import {omsMiddleware, omsMiddlewareInit} from "../actions/oms-middleware";
import {loggingMiddleware} from "../actions/logging-middleware";


import React from "react";


//----- combine middlewares -----
const middlewares = applyMiddleware(loggingMiddleware, omsMiddleware);


//----- reducer section -----


//----- store section (needs: root reducer, and middlewares)

const store = createStore(reducer, composeWithDevTools(middlewares));

// ---- actions (needs: store)
const bindf = (unbound:any) => bindActionCreators(unbound, store.dispatch as unknown as Dispatch<AnyAction>);

export const actions  = actionsInit(bindf);              // binds all the actions


//---- any middleware that maps to actions must be initialized only after actions are bound ----
// once actions are available initialize middlewares that need additional access
omsMiddlewareInit(actions);       // middleware needs access to actions, possibly at initialization time




export function connectRootComponent(WrappedComponent: React.ComponentType) {
  // Creating the inner component. The calculated Props type here is the where the magic happens.
  const component = () => <Provider store={store}><WrappedComponent/></Provider>;
  component.displayName = `ReduxConnected(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;
  return component;
}


// if we don't create our own alias to useSelector, then every component that uses it relies directly on redux
// whereas this could be satisfied with other state management libraries
export const useSelector = reduxUseSelector;


// todo starts here
// + kill files actions.js and reducers.js so that all integration happens in actions-integration
// + make a single file that imports all the slices and constructs the overal state type
// + and explicitly lists each slice as a named thing called Slices?  This will be the type of the thing that
// + gives typesafety to whoever accesses the actions

