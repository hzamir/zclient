import "reflect-metadata";
import {Config} from "./utils/config";
import {Inflate} from "./utils/inflate";

// get the relevant classes registered for injection with an import
import './fsm-utils/test-class';
import './index.css';
import {connectRootComponent} from './actions-integration';
import {default as App} from './App';
import {render} from "react-dom";
import React from "react";


(async ()=>{
    try {
        const config = await Config.fetch('/config/hello.yaml');
        console.warn(`config loaded`);
        const inflate = new Inflate(config);
        const extendedConfig = inflate.intializeSequence('bootSequence');

        const RootComponent =  connectRootComponent(App) as unknown as React.Component;
        // @ts-ignore
        render(<RootComponent/>,  document.getElementById('root'));
    } catch(e) {
        console.error(e);
    }
})();

