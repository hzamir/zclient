import { bindActionCreators, createStore} from "redux";
import {composeWithDevTools} from "redux-devtools-extension";
import {Provider} from "react-redux";
import {render} from "react-dom";
import React from "react";

import { unboundActions, actionsInit } from './redux/actions';
import { middlewares, middlewaresInit  } from './redux/middlewares';
import { reducer        } from './redux/reducers';

import './index.css';
import App from "./App";


// first define a single store, and apply all middlewares
const store = createStore(reducer, composeWithDevTools(middlewares));

// bind all actions and make them available to middleware
const actions = bindActionCreators(unboundActions, store.dispatch);

Object.freeze(actions);

actionsInit(actions);
middlewaresInit(actions); // our middleware needs access to actions

// todo this is a temporary test
const toggleInterval = setInterval(()=>actions.toggleLeft(100), 1_000);
setTimeout(()=>clearInterval(toggleInterval), 10_000);


export function connectApp()
{
  render(
    <Provider store={store}>
      <App/>
    </Provider>,
    document.getElementById('root')
  );
}

