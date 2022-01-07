import { bindActionCreators, createStore} from "redux";
import {composeWithDevTools} from "redux-devtools-extension";
import {connect, Provider} from "react-redux";
import {render} from "react-dom";
import React from "react";

import { unboundActions } from './redux/actions';
import { middlewares, middlewaresInit  } from './redux/middlewares';
import { selectors      } from './redux/selectors';
import { reducer        } from './redux/reducers';

import './index.css';
import App from "./App";


// first define a single store, and apply all middlewares
const store = createStore(reducer, composeWithDevTools(middlewares));

// bind all actions and make them available to middleware
const actions = bindActionCreators(unboundActions, store.dispatch);
middlewaresInit(actions); // our middleware needs access to actions

// todo this is a temporary test
// const toggleInterval = setInterval(()=>actions.toggleLeft(100), 1_000);
// setTimeout(()=>clearInterval(toggleInterval), 10_000);

// connect() is on the way out but first getting simpler and simpler
const mapStateToProps     = state => ({...state, ...selectors(state)});
const mapDispatchToProps = (/*dispatch*/) => ({actions});

// connect is on the way out
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

