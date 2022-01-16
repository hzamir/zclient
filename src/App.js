import React, {useEffect, useRef} from 'react';
import styled from 'styled-components';

import {Ladom} from "./Ladom";
import {MyGrid} from "./MyGrid";
import {columnDefsMap} from "./xform/columndefs";
import {StateForm} from "./StateForm";
import { securityLightConfig, sec2, securityLightPlantUml} from "./fsm-configs/security-light";
import {glassMachineConfig} from "./fsm-configs/glass";
import {umlHeartbeatSubscription,heartbeatXStateConfig} from './fsm-configs/subscription';
import { useSelector } from './redux/use-selector';
import {actions} from './redux/actions';
import {aPartiesSelector, aQuotesSelector, aTradesSelector, selectors} from "./redux/selectors";
import {isNumber} from "luxon/src/impl/util";

const palette = {
      plum: '#4b54a1',
      black: '#0c0e0d',
      blueslate: '#465f73',
      slate: '#5f5f7b',
      drab: '#b1c3a9',
      sky: '#5e86ba',
      moon: '#b3961e',
      midnight: '#0b2383',

      gold: 'gold',
      cornsilk: 'cornsilk',
      blue: 'blue',
      forest: 'forestgreen',
      crimson: 'crimson'
};

const Layout = styled.div`
    display:grid;
    height: calc(100vh);
    width: calc(100vw);
    
    row-gap:4px;
    column-gap:4px;

    grid-template-columns: ${props=>props.left}px minmax(0, 1fr) ${props=>props.right}px;
    grid-template-rows: 30px minmax(0, 1fr) 30px;
    grid-template-areas: "Navbar Navbar Navbar"
                         "Left CenterBody Right"
                         "Footer Footer Footer";    
`;

Layout.defaultProps = {left:200, right:100};

const Navbar = styled.section`
    grid-area: Navbar;
    background-color: ${palette.midnight};
    color: ${palette.drab};
`;
const Footer = styled.section`
    grid-row-start:3; 
    grid-column-start:1; grid-column-end:4;
    background-color: ${palette.blueslate};
    color: ${palette.drab};
`;

const CenterBody = styled.section`
    display: block;
    height:100%;
    grid-area: CenterBody;
    background-color: ${palette.drab};
    color: ${palette.black};
`;
const Left = styled.section`
    grid-area: Left;
    background-color: ${palette.cornsilk};
    color: ${palette.midnight};
`;
const Right = styled.section`
    grid-area: Right;
    background-color: ${palette.cornsilk};
    color: ${palette.midnight};
`;


const somejsx = <div>Hello<br/>There</div>;

const closef=()=>console.warn('closing');




const gridMap = {
    Trades: 'aTrades',
    Quotes: 'aQuotes',
    Parties: 'aParties'
};

const secondsFormatter = (params)=>isNumber(params.value)? params.value.toFixed(2):undefined;


let interval;
const  App = (props) => {
  const {gridChoice, pollInterval, layout:{left,right}} = useSelector(s=>s);
  const {aTrades,aQuotes,aParties} = useSelector(selectors);


  // useEffect(()=>{
  //   const {omsTradeList, omsQuoteList, omsPartyList} = actions();
  //   omsPartyList();
  //   omsQuoteList();
  //   omsTradeList();
  // }, [])

  // this necessarily  belong here but while transitioning out...
  useEffect(()=>{
    const {omsTradeList, omsQuoteList, omsPartyList} = actions();
    const map = {Trades: omsTradeList, Quotes:omsQuoteList, Parties: omsPartyList}
    const pollingAction = map[gridChoice];

    clearInterval(interval);
    setInterval(pollingAction, pollInterval);
  }, [gridChoice, pollInterval])


  const rowDataPicker = {aTrades, aQuotes, aParties};


  const {halveInterval, doubleInterval, pickGrid,  toggleLeft,toggleRight, omsVersion} = actions();

  const rowDataProp = gridChoice;
  const rowData = rowDataPicker[gridMap[rowDataProp]]||[];

  const columnDefs =  columnDefsMap[rowDataProp];

  // console.info(`props for grid are ${rowDataProp}`, columnDefs, rowData, aQuotes);


   return  (
        <Layout left={left} right={right}>
            <Navbar>There is text here

              <button onClick={()=>pickGrid('Trades')}>Trades</button>
              <button onClick={()=>pickGrid('Quotes')}>Quotes</button>
              <button onClick={()=>pickGrid('Parties')}>Parties</button>

              Requesting data for: '{gridChoice}'
              <button onClick={halveInterval}> Halve Interval</button>
              Polling Interval is: {(pollInterval).toLocaleString('en-US')} milliseconds
              <button onClick={doubleInterval}> Double Interval</button>

              // put some buttons here to switch the grid
                <button onClick={()=>{toggleLeft(100)}}>Left</button>
                <button onClick={()=>{toggleRight(300)}}>Right</button>
                <button onClick={omsVersion}>OMS Version</button>
              <button onClick={()=>{omsVersion();omsVersion();omsVersion();omsVersion();omsVersion();omsVersion()}}>OMS Version Bomb</button>


            </Navbar>
            <Left>In left side bar?</Left>

          <CenterBody><MyGrid rowData={rowData} columnDefs={columnDefs}/></CenterBody>

          {/*<CenterBody>*/}
          {/*    <textarea readOnly={true} value={umlHeartbeatSubscription}/>*/}
          {/*    <StateForm expanded={true} stConfig={heartbeatXStateConfig}/>*/}
          {/*    <StateForm expanded={true} stConfig={securityLightConfig}/>*/}
          {/*    <StateForm expanded={true} stConfig={glassMachineConfig}/>*/}
          {/*      /!*<MyGrid rowData={rowData} columnDefs={columnDefs}/>*!/*/}

          {/*  </CenterBody>*/}
            <Right>In right sidebar?</Right>
            <Footer>Status stuff is over here</Footer>
        </Layout>
    );
};


export default App;
