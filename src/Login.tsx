import React, { useState} from 'react';
import {actions, useSelector} from './actions-integration';
import {AuthState} from './actions/auth-slice';
import styled from 'styled-components';

type InputChangeEventHandler = React.ChangeEventHandler<HTMLInputElement>

const LoginBackdrop = styled.div`
  display:          block;      /* Hidden by default */
  position:         fixed;     /* Stay in place */
  z-index:          1;         /* Sit on top */
  left:             0;
  top:              0;
  width:            100%;            /* Full width */
  height:           100%;            /* Full height */
  overflow:         auto;            /* Enable scroll if needed */
  background-color: rgb(0,0,0);      /* Fallback color */
  background-color: rgba(0,0,200,0.6);
  backdrop-filter: blur(4px)
`;

const LoginDiv = styled.div`
  background-color: #fefefe;
  margin:           5% auto; /* 15% from the top and centered */
  padding:          20px;
  border:           1px solid #888;
  width:            40em;
  height:           400px;
  overflow-y: auto;
`;

const BlockLabel = styled.label`
  display: block;
  min-width: 200px;
  padding: 10px;
`

const MyTable = styled.table`
  margin: 10px 10px;
  
  width: 400px;
  border-collapse: collapse;
  table-layout: fixed;
  
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

export const  Login = () => {
  const [name, setName] = useState('hzamir@gmail.com');
  const [ pwd, setPwd] = useState('Willow0602!');

  const auth:AuthState = useSelector((s:any)=>s.auth);
  const {login} = actions.auth;

  const hName:InputChangeEventHandler = (event) => setName(event.target.value);
  const hPwd:InputChangeEventHandler = (event) => setPwd(event.target.value);

  const submit = (event:React.FormEvent) =>{
    login(name,pwd);
    event.preventDefault();
  }

  return (
    <LoginBackdrop>
      <LoginDiv>
        <form onSubmit={submit}>
          <BlockLabel >Name:     <input type="text" value={name} onChange={hName} /></BlockLabel>
          <BlockLabel >Password: <input type="text" value={pwd}  onChange={hPwd}  /></BlockLabel>
          <input type="submit" value="Login" />
        </form>
        <hr/>

        <MyTable>
          <thead>
            <tr><th>Property</th><th>Value</th></tr>
          </thead>
          <tbody>
          {/*list all the properties of auth slice in the dialog for debugging purposes*/}
          {Object.entries(auth).map(([k,v])=><tr key={k}><td>{k}:</td><td>{stringize(v)}</td></tr>)}
          </tbody>
        </MyTable>
      </LoginDiv>
    </LoginBackdrop>
  );

}
