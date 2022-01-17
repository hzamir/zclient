export const commonKeys = (a, b) => Object.keys(a).filter({}.hasOwnProperty.bind(b));


const oA = {a:1, b:2, c:3};
const oB = {x:1, y:0, z:0 };
const oBc = {x:1, y:0, a:2};

// todo move this to a proper test
const testcases = [
  [oA,oB, 'a/b expect 0' ],
  [oB,oA, 'b/a expect 0'],
  [oA, oA, 'a/a expect all keys'],
  [oA, oBc, 'a/bc expect 1'],
  [ oBc, oA,  'bc/a expect 1']];

// move this to a test
testcases.forEach(arr=>{
  const [a,b, desc] = arr;
  const result = commonKeys(a,b);
  console.log(`testing intersection ${desc} actual ${result.length} of a, b`, result, a, b);
});

