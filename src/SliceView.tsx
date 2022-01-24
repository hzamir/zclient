import React from 'react';
import { useSelector } from './actions-integration';
import styled from 'styled-components';
import {Expandit} from './ExpandIt';


const SliceDiv = styled.div`
  background-color: #fefefe;
  margin:           5% auto; /* 15% from the top and centered */
  padding:          5px;
  border:           1px solid #888;
  width:            auto;
`;

const MyTable = styled.table`
  margin: 10px 10px;
  
  width: 400px;
  border-collapse: collapse;
  
  // alternate row colors
  tbody tr:nth-child(odd) {
    background-color: #eee;
  }
  tbody tr:nth-child(even) {
    background-color: #ccc;
  }

  // property column should be right aligned value
  tbody tr td:first-child { 
    text-align:right; 
  }
  tbody tr td:nth-child(2) {
    padding-left: 1em;
  }
`

const stringize = (v:any) => JSON.stringify(v)

interface RDivProps {
  thing:any;
}

const RDiv = (props:RDivProps) => {
  const {thing} = props;

  if(thing && (typeof thing === 'object')) {
    return (
    <MyTable>
      <thead>
      <tr><th>Property</th><th>Value</th></tr>
      </thead>
      <tbody>
      {/*list all the properties of auth slice in the dialog for debugging purposes*/}
      {Object.entries(thing).map(([k,v])=><tr key={k}><td>{k}:</td><td>{stringize(v)}</td></tr>)}
      </tbody>
    </MyTable>);
  } else {
    return <span>{stringize(thing)}</span>
  }
}


interface SliceViewProps {
  slice:string;
}

// given the name of a Slice extract its properties
// todo get a list of its actions and parameters
export const  SliceView = (props:SliceViewProps) => {
  const slice:Record<string, any> = useSelector((s:any)=>s[props.slice]);
  return (
      <SliceDiv>
        <Expandit title={`Slice '${props.slice}'`}>
        <MyTable>
          <thead>
          <tr><th>Property</th><th>Value</th></tr>
          </thead>
          <tbody>
          {/*list all the properties of auth slice in the dialog for debugging purposes*/}
          {Object.entries(slice).map(([k,v])=><tr key={k}><td>{k}:</td><td><RDiv thing={v}/></td></tr>)}
          </tbody>
        </MyTable>
        </Expandit>
      </SliceDiv>
  );
}
