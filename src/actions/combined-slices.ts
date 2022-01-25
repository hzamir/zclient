// -- standard slices --
import {sliceConfig as requestSlice} from "./request-slice";
import {sliceConfig as notifySlice} from "./notify-slice";
import {sliceConfig as coverageSlice} from './coverage-slice';

//-- standard middlewares
import {loggingMiddleware} from "./logging-middleware";
import {fatalMiddleware} from './fatal-middleware';
import {coverageMiddleware, coverageMiddlewareInit} from './coverage-middleware';

// -- app specific slices --
import {sliceConfig as localSlice} from "./local-slice";
import {sliceConfig as controlSlice} from "./control-slice";
import {sliceConfig as authSlice} from './auth-slice';
import {sliceConfig as omsSlice}  from "./oms-slice";

//-- app specific middlewares
import {omsMiddleware, omsMiddlewareInit} from "./oms-middleware";
import {authMiddleware, authMiddlewareInit} from './auth-middleware';


export const allSlices = [requestSlice, notifySlice, coverageSlice, omsSlice, localSlice, controlSlice,  authSlice];
export const allMiddlewares = [ fatalMiddleware, omsMiddleware, authMiddleware, coverageMiddleware, loggingMiddleware];
export const middlewareInits = [ omsMiddlewareInit, authMiddlewareInit, coverageMiddlewareInit];

// when I get smarter about deriving types in typescript I can fix this (he claims)
// but the important thing is it makes every part of state known
export type TotalState = Readonly<{
  // @ts-ignore
  [requestSlice.name]: typeof requestSlice.initialState,
  // @ts-ignore
  [notifySlice.name]: typeof requestSlice.initialState,
  // @ts-ignore
  [coverageSlice.name]: typeof coverageSlice.initialState,

  // @ts-ignore
  [omsSlice.name]: typeof omsSlice.initialState,
  // @ts-ignore
  [localSlice.name]: typeof localSlice.initialState,
  // @ts-ignore
  [controlSlice.name]: typeof controlSlice.initialState,
  // @ts-ignore
  [authSlice.name]: typeof authSlice.initialState,
}>
