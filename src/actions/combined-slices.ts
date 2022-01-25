// -- standard slices --
import {sliceConfig as requestSlice,RequestState} from "./request-slice";
import {sliceConfig as notifySlice,NotifyState} from "./notify-slice";
import {sliceConfig as coverageSlice,CoverageState} from './coverage-slice';

//-- standard middlewares
import {loggingMiddleware} from "./logging-middleware";
import {fatalMiddleware} from './fatal-middleware';
import {coverageMiddleware, coverageMiddlewareInit} from './coverage-middleware';

// -- app specific slices --
import {sliceConfig as localSlice, LocalState} from "./local-slice";
import {sliceConfig as controlSlice, ControlState} from "./control-slice";
import {sliceConfig as authSlice, AuthState} from './auth-slice';
import {sliceConfig as omsSlice, OmsState}  from "./oms-slice";

//-- app specific middlewares
import {omsMiddleware, omsMiddlewareInit} from "./oms-middleware";
import {authMiddleware, authMiddlewareInit} from './auth-middleware';


export const allSlices = [requestSlice, notifySlice, coverageSlice, omsSlice, localSlice, controlSlice,  authSlice];
export const allMiddlewares = [ fatalMiddleware, omsMiddleware, authMiddleware, coverageMiddleware, loggingMiddleware];
export const middlewareInits = [ omsMiddlewareInit, authMiddlewareInit, coverageMiddlewareInit];

// when I get smarter about deriving types in typescript I can presumably fix this (he claims)
// but the important thing is it makes every part of state known
//There is a source of truth problem, I need to derive the keys from the slice names directly encountered issues
// with non-literals
export type TotalState = {
   request: RequestState;
    notify: NotifyState;
  coverage: CoverageState;
       oms: OmsState;
     local: LocalState;
   control: ControlState;
      auth: AuthState;
}

