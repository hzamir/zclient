import {applyMiddleware, bindActionCreators, createStore} from "redux";
import {composeWithDevTools} from "redux-devtools-extension";
import {getMiddleware, init} from "./example-redux-middleware";
import * as actionCreators from "./action-creators";
import {connect, Provider} from "react-redux";
import App from "./App";
import {render} from "react-dom";
import React from "react";

import { selectors } from "./redux/selectors";
import { reducer   } from "./redux/reducers";

import './index.css';

const store = createStore(
  reducer,
  composeWithDevTools(
    applyMiddleware(getMiddleware)
  )
);

const mapStateToProps = state => {
  return {...state, ...selectors(state)};
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

