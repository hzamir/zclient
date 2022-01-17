
const initialState = {
  gridChoice: 'Trades',
  layout: {
    left: 100,
    right: 100,
  }
};

const reducers = {
  pickGrid:    (s, {value})   =>({...s, gridChoice:value}),
  toggleLeft:  (s, {expanded})=>({...s, layout: {...s.layout, left: s.layout.left? 0: expanded}}),
  toggleRight: (s, {expanded})=>({...s, layout: {...s.layout, right: s.layout.right? 0: expanded}}),
};

export const sliceConfig = {name: 'local', initialState, reducers};

