import {applyMiddleware} from "redux";
import {getMiddleware, init} from "./example-redux-middleware";

export const middlewares = applyMiddleware(getMiddleware);
export const middlewaresInit = init;
