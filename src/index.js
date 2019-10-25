import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

import {seclightFsm} from "./fizbin/fizbintest";

console.log('seclight', seclightFsm.state());

ReactDOM.render(<App />, document.getElementById('root'));

