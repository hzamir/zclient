
const initialState = {
  gridChoice: 'Trades',
  layout: {
    left: 100,
    right: 100,
  }
};

// type value will be added automatically to creators to match the key, or better yet to match the slice/key
const creators = {
  pickGrid:     (value) => ({value}),
  toggleLeft:   (expanded) => ({expanded}),
  toggleRight:  (expanded) => ({expanded}),
};

const reducers = {
  pickGrid:    (s, {value})   =>({...s, gridChoice:value}),
  toggleLeft:  (s, {expanded})=>({...s, layout: {...s.layout, left: s.layout.left? 0: expanded}}),
  toggleRight: (s, {expanded})=>({...s, layout: {...s.layout, right: s.layout.right? 0: expanded}}),
};

export const sliceConfig = {name: 'local', creators, initialState, reducers};

