import {SliceInfo, SliceCoverage} from './coverage-slice';
import {oReduce} from '../utils/oreduce';
import {Action, NextF} from '../actions-integration/types';

type SliceActions = Record<string, unknown>;
type AllSliceActions = Record<string, SliceActions>;

// unpopulated
let sliceInfos:Record<string, SliceInfo>;
let coverageActions:any; // there must be an auth slice

const kReportAfterNHits:number = 10;  // move to configuration, this an time to report activity that doesn't hit quantity threshold

const createSliceInfo = (name:string, sas: SliceActions):SliceInfo => {
  return {
    sliceName:name,
    hits:0,
    lastUpdated:0,
    percentCoverage:0,
    sliceCoverage: oReduce(Object.keys(sas), (k:string)=>[k,0]) // curiously typescript should have inferred k is a string
  };
}

const hit = (slice:string, action:string) => {
  const sliceInfo:SliceInfo = sliceInfos[slice];
  const hits = ++sliceInfo.hits;
  sliceInfo.sliceCoverage[action]++; // update individual item
  sliceInfo.lastUpdated = Date.now();
  if(hits % kReportAfterNHits === 0)
    coverageActions.updateSlice(sliceInfo);
}

export const coverageMiddleware = (store:any) => (next:NextF) => (a:Action)=> {
  const aType = a.type || '';

  const [slice,action] = aType.split('/');
  const result = next(a);
  hit(slice,action)
  // decode which slice it is from

  return result;
}

export const coverageMiddlewareInit = (actions:AllSliceActions) =>
{
  sliceInfos = oReduce(Object.entries(actions),([k,v]:[string, SliceActions])=>[k, createSliceInfo(k,v)]);
  coverageActions = actions.coverage;
};

