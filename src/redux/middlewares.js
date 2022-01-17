import {applyMiddleware} from "redux";
import {omsMiddleware, init} from "./oms-middleware";
import {loggingMiddleware} from "./logging-middleware";

export const middlewares = applyMiddleware(loggingMiddleware, omsMiddleware);
export const middlewaresInit = init;
