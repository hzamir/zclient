import React, {useEffect, useRef, useState} from 'react';
import styled from 'styled-components';

import {Ladom} from "./Ladom";
import {Login} from './Login';
import {MyGrid} from "./MyGrid";
import {columnDefsMap} from "./xform/columndefs";
import {actions, useSelector} from './actions-integration';

import {aPartiesSelector, aQuotesSelector, aTradesSelector, selectors} from "./actions/selectors";

import {isNumber} from "luxon/src/impl/util";
import {SliceView} from "./SliceView";
import {SnackbarProvider, useSnackbar} from "notistack";
import {NotifyWrapper} from "./NotifyWrapper";

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

Layout.defaultProps = {left:200, right:0};

const Navbar = styled.section`
    grid-area: Navbar;
    padding-top: 5px;
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


const closef=()=>console.warn('closing');




const gridMap = {
    Trades: 'aTrades',
    Quotes: 'aQuotes',
    Parties: 'aParties'
};

const secondsFormatter = (params)=>isNumber(params.value)? params.value.toFixed(2):undefined;


let interval;

const topCssAttributes = `
  padding-right:          5px;
  padding-left:          5px;
  margin-left: 5px;
  margin-right: 5px;
`;

const TopItem   = styled.span`
${topCssAttributes}
:after {
  content: '\\00a0\\00a0'; // effectively nbsp
  width: 0;
  //height: 100%;
  border-right: 1px solid white;
  top: 0;
  bottom: 0;
}


`; // sharing attributes since don't want button to inherit span
const TopButton = styled.button`${topCssAttributes}`;

const AllSlices = () => <div>{Object.keys(actions).map((slice)=><SliceView key={slice} slice={slice}/>)}</div>;

const wholeSeconds = (seconds) => seconds.toLocaleString('en-US', {minimumIntegerDigits:3, maximumFractionDigits:0});

let messageCtr = 0;

const  App = () => {
  const [showSlices, setShowSlices] = useState(false);

  // useSelector got complex because we didn't compensate for adding slices
  // resimplify after adding some types to make this easier
  const {
    control:  {pollInterval},
    local:    {gridChoice, layout:   {left,right}},
    notify:   {notices:[notice=undefined]},
    auth: {refreshToken, claims: {exp:tokenExpiration}}
    } = useSelector(s=>s);

  const {aTrades,aQuotes,aParties} = useSelector(selectors);

  // useEffect(()=>{
  //   const {omsTradeList, omsQuoteList, omsPartyList} = actions;
  //   omsPartyList();
  //   omsQuoteList();
  //   omsTradeList();
  // }, [])

  // this necessarily  belong here but while transitioning out...
  useEffect(()=>{

    const {oms:{omsTradeList, omsQuoteList, omsPartyList}} = actions;
    const map = {Trades: omsTradeList, Quotes:omsQuoteList, Parties: omsPartyList}
    const pollingAction = map[gridChoice];

    clearInterval(interval);
    interval = setInterval(pollingAction, pollInterval);
  }, [gridChoice, pollInterval]);


  const rowDataPicker = {aTrades, aQuotes, aParties};

  const {halveInterval, doubleInterval} = actions.control;
  const { pickGrid,  toggleLeft, toggleRight, } = actions.local;
  const {omsVersion} = actions.oms;
  const {info,warn,error,fatal,dismiss} = actions.notify;
  const {refresh} = actions.auth;

  const rowDataProp = gridChoice;
  const rowData = rowDataPicker[gridMap[rowDataProp]]||[];

  const columnDefs =  columnDefsMap[rowDataProp];

  // console.info(`props for grid are ${rowDataProp}`, columnDefs, rowData, aQuotes);

  const secsLeft = Math.trunc((tokenExpiration*1000 - Date.now()) * 0.001);

   return  (
   <SnackbarProvider maxSnack={5} hideIconVariant
                     anchorOrigin={{vertical: "top", horizontal: "right",}}
                     >
     <NotifyWrapper />
        <Layout left={left} right={right}>
            <Navbar>
              <TopButton onClick={()=>pickGrid('Trades')}>Trades</TopButton>
              <TopButton onClick={()=>pickGrid('Quotes')}>Quotes</TopButton>
              <TopButton onClick={()=>pickGrid('Parties')}>Parties</TopButton>

              <TopButton onClick={()=>fatal({msg:`${messageCtr++}: I am fatal`})}>Fatal Message</TopButton>
              <TopButton onClick={()=>error({msg:`${messageCtr++}: Seen one error`, remedy:'Acknowledge'})}>Error Message</TopButton>

              <TopButton onClick={()=>warn({msg:`${messageCtr++}: This is a warning with Modal as a remedy`, remedy:'Modal'})}>Modal Warning</TopButton>
              <TopButton onClick={()=>warn({msg:`${messageCtr++}: This is a warning with Acknowledge as a remedy`, remedy:'Acknowledge'})}>Warning</TopButton>

              <TopButton onClick={()=>refresh(refreshToken)}>Refresh Token</TopButton>
              <TopItem>Seconds left: {wholeSeconds(secsLeft)}</TopItem>

              <TopItem>Requesting data for: '{gridChoice}'</TopItem>
              <TopButton onClick={halveInterval}> Halve Interval</TopButton>
              <TopItem>Polling Interval is: {(pollInterval).toLocaleString('en-US')} milliseconds</TopItem>
              <TopButton onClick={doubleInterval}> Double Interval</TopButton>

              <TopButton onClick={()=>{toggleLeft(100)}}>Left</TopButton>
              <TopButton onClick={()=>{toggleRight(900)}}>Toggle Slice View</TopButton>
              <TopButton onClick={omsVersion}>OMS Version</TopButton>
              <TopButton onClick={()=>{omsVersion();omsVersion();omsVersion();omsVersion();omsVersion();omsVersion()}}>OMS Version Bomb</TopButton>

            </Navbar>
            <Left>In left side bar?</Left>


          <CenterBody>
            {!refreshToken && <Login/>}
            {notice && notice.level === 'fatal'?
              <Ladom content={notice.msg} noClose/>
                :
              (notice && notice.remedy === 'Modal')? /*Modal isn't really one of the options */
                <Ladom content={<div><h1>notice.level</h1><hr/>notice.msg</div>} close={()=>{dismiss(notice.key)}}/>
                :<MyGrid rowData={rowData} columnDefs={columnDefs}/>
            }
          </CenterBody>

            <Right><AllSlices/></Right>
        </Layout>
   </SnackbarProvider>
    );
};


export default App;
