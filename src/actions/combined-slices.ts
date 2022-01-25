import {sliceConfig as omsSlice}  from "./oms-slice";
import {sliceConfig as localSlice} from "./local-slice";
import {sliceConfig as controlSlice} from "./control-slice";
import {sliceConfig as requestSlice} from "./request-slice";
import {sliceConfig as notifySlice} from "./notify-slice";
import {sliceConfig as authSlice} from './auth-slice';
import {sliceConfig as coverageSlice} from './coverage-slice';

// todo move this to combined slices and middlewares
import {omsMiddleware, omsMiddlewareInit} from "./oms-middleware";
import {loggingMiddleware} from "./logging-middleware";
import {fatalMiddleware} from './fatal-middleware';
import {authMiddleware, authMiddlewareInit} from './auth-middleware';
import {coverageMiddleware, coverageMiddlewareInit} from './coverage-middleware';


export const allSlices = [omsSlice, localSlice, controlSlice,  requestSlice, notifySlice, authSlice,coverageSlice];
export const allMiddlewares = [ fatalMiddleware, omsMiddleware, authMiddleware, coverageMiddleware, loggingMiddleware];
export const middlewareInits = [ omsMiddlewareInit, authMiddlewareInit, coverageMiddlewareInit];
