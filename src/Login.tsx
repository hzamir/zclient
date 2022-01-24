import React, { useState} from 'react';
import {actions, useSelector} from './actions-integration';
import styled from 'styled-components';
import {SliceView} from './SliceView';

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
  width:            auto;
  height:           auto;
  max-height: 800px;
  overflow-y: scroll;
`;

const BlockLabel = styled.label`
  display: block;
  min-width: 200px;
  padding: 10px;
`

export const  Login = () => {
  const [name, setName] = useState('hzamir@gmail.com');
  const [ pwd, setPwd] = useState('Willow0602!');
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
        <SliceView slice='auth'/>
        <SliceView slice='request'/>
        <SliceView slice='notify'/>


      </LoginDiv>
    </LoginBackdrop>
  );

}
