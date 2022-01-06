// reselect code here
import { createSelector } from "reselect";

const tradesSelector    = s => s.trades;
const partiesSelector   = s => s.parties;
const quotesSelector    = s => s.quotes;

const aTradesSelector  = createSelector(tradesSelector, o=>Object.values(o).slice(-100));
const aQuotesSelector  = createSelector(quotesSelector, o=>Object.values(o));
const aPartiesSelector = createSelector(partiesSelector, o=>Object.values(o));


// returns selectors from state
export const selectors = (state) => {

  const aTrades  = aTradesSelector(state);
  const aQuotes  = aQuotesSelector(state);
  const aParties = aPartiesSelector(state);

  return {aTrades,aQuotes,aParties};
};
