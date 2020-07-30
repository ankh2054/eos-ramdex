/*******************************
* Copyright 2018 Andrew Coutts
********************************/
import React, { Fragment, useEffect, useState, } from 'react';
import './index.scss';
import TVChart from '../TVChart';
import TradePanel from '../TradePanel';
import RecentTradesBox from '../RecentTradesBox';
import DashboardStatistics from '../DashboardStatistics';
import InfoBarHeader from '../InfoBarHeader';
import FooterBar from '../FooterBar';
import ScatterMissingNotification from '../ScatterMissingNotification';
import stream from '../TVChart/api/stream';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ScatterJS from "scatterjs-core";
import { JsonRpc, Api } from "eosjs";

import PropTypes from 'prop-types';
import clsx from 'clsx';

import { connect } from 'react-redux';

import LastUpdateTime from '../LastUpdateTime';
import ErrorTx from '../ErrorTx';
import InfoMsg from '../InfoMsg';
import SuccessTx from '../SuccessTx';

import {
  Card,
  CardContent
} from '@material-ui/core';


const Dashboard = (props) => {
  const {
    footerFixed,
    contentBackground
  } = props;

  const [scatterLoading, setScatterLoading] = useState(true);
  const [scatter, setScatter] = useState(null);
  const [currentConnectionStatus, setCurrentConnectionStatus] = useState('Connecting...');
  const [currentRamPriceBytes, setCurrentRamPriceBytes] = useState('Loading..');


  const [lastUpdateTimestamp, setLastUpdateTimestamp] = useState(null);
  const [recentTradesArray, setRecentTradesArray] = useState([]);
  const [lastKnownTradesAraryTx, setLastKnownTradesAraryTx] = useState(null);
  const [loggedInState, setLoggedInState] = useState(null);

  const [accBal, setAccBal] = useState(null);
  const [accRamQuota, setAccRamQuota] = useState(null);
  const [accRamUsed, setAccRamUsed] = useState(null);


  const [scatterEosObj, setScatterEosObj] = useState(null);
  const [voterInfo, setVoterInfo] = useState(null);
  const [lastTxId, setLastTxId] = useState(null);
  const [lastTxResp, setLastTxResp] = useState(null);
  const [eosReqFields, setEosReqFields] = useState(null);
  const [options, setOptions] = useState(null);

  const [accStats_account_name, setAccStats_account_name] = useState(null);
  const [accStats_cpu_limit_available, setAccStats_cpu_limit_available] = useState(null);
  const [accStats_cpu_limit_max, setAccStats_cpu_limit_max] = useState(null);
  const [accStats_cpu_limit_used, setAccStats_cpu_limit_used] = useState(null);
  const [accStats_cpu_weight, setAccStats_cpu_weight] = useState(null);
  const [accStats_created, setAccStats_created] = useState(null);
  const [accStats_net_limit_available, setAccStats_net_limit_available] = useState(null);
  const [accStats_net_limit_max, setAccStats_net_limit_max] = useState(null);
  const [accStats_net_limit_used, setAccStats_net_limit_used] = useState(null);
  const [accStats_total_resources_cpu_weight, setAccStats_total_resources_cpu_weight] = useState(null);
  const [accStats_total_resources_net_weight, setAccStats_total_resources_net_weight] = useState(null);

  const updateScatterLoading = (loading) => {
    // scatterLoading = loading;
    setScatterLoading(loading);
  }

  const handleNewPriceChange = (data) => {
    //currentRamPriceBytes = data.price;
    setCurrentRamPriceBytes(data.price);
    lastUpdateTimestamp = data.timestamp;

  };

  const handleNewTradesChange = (tradesArray) => {
    //~ console.log(`Handling update for trades`);
    if (lastKnownTradesAraryTx !== tradesArray[0].txid) {
      //console.log('trades array updated');
      recentTradesArray = tradesArray;
      lastKnownTradesAraryTx = tradesArray[0].txid;
    }
  };

  const handleSocketConnectionStatus = (status) => {
    //currentConnectionStatus = status;
    setCurrentConnectionStatus(status);
  };



  useEffect(() => {
    stream.subscribeFrontend(handleNewPriceChange, handleNewTradesChange, handleSocketConnectionStatus);
  }, []);



  let updateInterval = null

  let rpc = new JsonRpc(process.env.api_node || "https://chain.wax.io:443", { fetch })

  let network = ScatterJS.Network.fromJson({
    blockchain: 'eos',
    chainId: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
    host: 'chain.wax.io',
    port: 443,
    protocol: 'https'
  });






  const setLoggedIn = (e) => {
    switch (e) {
      case 0:
        notifyLogout();
        setAccBal('0 EOS');
        setAccRamQuota(0);
        setAccRamUsed(0);

        break;

      case 1:

        break;

      case 2:
        notifyLogin();
        break;

      case 3:
        notifyLoginInfo('Please unlock your Scatter wallet and try again');
        break;

      case 4:
        notifyLoginInfo('Login request cancelled');
        break;

      default:
        notifyLoginError(e);
        //console.log(e);
        break;
    }
  }

  const updateAccBal = async () => {
    if (!scatterEosObj) {
      console.log("scatterEosObj null, returning")
      return;
    }

    const res = await rpc.get_account(scatter.account("eos").name)
    console.log(res);

    setAccBal(res.core_liquid_balance);
    setAccRamQuota(res.ram_quota);
    setAccRamUsed(res.ram_usage);
    setAccStats_account_name(res.account_name);
    setAccStats_cpu_limit_available(res.cpu_limit.available);
    setAccStats_cpu_limit_max(res.cpu_limit.max);
    setAccStats_cpu_limit_used(res.cpu_limit.used);
    setAccStats_cpu_weight(res.cpu_weight);
    setAccStats_created(res.created);
    setAccStats_net_limit_available(res.net_limit.available);
    setAccStats_net_limit_max(res.net_limit.max);
    setAccStats_net_limit_used(res.net_limit.used);
    setAccStats_total_resources_cpu_weight(res.total_resources.cpu_weight);
    setAccStats_total_resources_net_weight(res.total_resources.net_weight);
    setVoterInfo(res.voter_info);

  };

  /*-----------------------------------*/

  const loginHandler = (e) => {
    //~ console.log(`login handler`);
    e.preventDefault();
    if (loggedInState === 2) {
      scatterLogout();
    } else {
      scatterLogin();
    }
  }

  const voteSentnl = async () => {
    if (loggedInState !== 2) {
      notifyTx("error", "Please log in first", null)
      return
    }

    let votersArray = []

    if (voterInfo) {
      if (Object.prototype.hasOwnProperty.call(voterInfo, "producers")) {
        if (voterInfo.length === 30) {
          // If the user already has 30 producers, replace the last one
          votersArray.concat(voterInfo.filter((e) => voterInfo.indexOf(e) !== voterInfo.length - 1))
        }
      }
    }

    // Add eos42freedom
    votersArray.push("sentnlagents")

    try {
      const result = await scatterEosObj.transact(
        {
          actions: [
            {
              account: "eosio",
              name: "voteproducer",
              authorization: [
                {
                  actor: scatter.account("eos").name,
                  permission: scatter.account("eos").authority,
                },
              ],
              data: {
                voter: scatter.account("eos").name,
                proxy: "",
                producers: votersArray,
              },
            },
          ]
        },
        {
          blocksBehind: 3,
          expireSeconds: 30,
        },
      )
      notifyTx("success", "Transaction Successful", result.processed.id)
    } catch (e) {
      console.log(e.message)
      notifyTx("error", e.message.slice(0, 1).toUpperCase().concat(e.message.slice(1, e.message.length)), null)
    }
  }


  const scatterLogin = async () => {
    if (!scatter) {
      //~ console.log('scatter is missing');
      window.open('https://get-scatter.com/', '_blank');
      return;
    }
    setLoggedIn(1); // logging in?
    await scatter.suggestNetwork(network)

    //~ console.log(`loginHandler: currently logged out, processing login`);
    //~ console.log(`Scatter: Getting identity..`);
    try {
      //~ console.log(`Attempting to login`);
      //~ const identityResult = await scatter.getIdentity({accounts: [network]});
      //~ console.log(identityResult);
      const identityResult = await scatter.getIdentity({ accounts: [network] })
      if (identityResult) {
        setLoggedIn(2);
        // console.log("Starting account update interval")
        await updateAccBal()
        updateInterval = setInterval(async () => await updateAccBal(), 5000);
      }
    } catch (e) {
      //~ console.log(`///////////// Caught error in login`);
      console.log(e);
      if (e.type === 'locked') {
        //~ console.log(`processing locked scatter request`);
        setLoggedIn(3);
      } else if (e.type === 'identity_rejected') {
        setLoggedIn(4);
      } else {
        setLoggedIn(e.message);
      }
    }
    //~ console.log(`Scatter: Authenticating identity..`);

    //~ console.log(scatter.identity.accounts[0]);
    //~ console.log(scatter.identity.accounts[0]);
    //~ Update account balance
  }



  const scatterLogout = () => {
    //~ console.log(`loginHandler: currently logged in, processing logout`);
    scatter.forgetIdentity();
    setLoggedIn(0);
    clearInterval(updateInterval)
  }

  const scatterInit = async () => {
    try {
      const result = await ScatterJS.scatter.connect(`waxram.sentnl.io`, { initTimeout: 15000 })
      if (result) {
        setScatter(ScatterJS.scatter);
        updateScatterLoading(false)
        window.scatter = null
        setScatterEosObj(ScatterJS.eos(network, Api, { rpc: new JsonRpc(process.env.REACT_APP_API_NODE || "https://chain.wax.io:443"), beta3: true }));


      } else {
        console.log("Warning: Scatter Desktop not found.")
        updateScatterLoading(false);
      }
    } catch (e) {
      console.error("Error while hooking Scatter: ", e)
      updateScatterLoading(false)
    }
  }

  const notifyLogin = () => toast.success("Successfully logged in", {
    position: toast.POSITION.TOP_CENTER,
    autoClose: 1700
  });

  const notifyLoginError = (error) => toast.error(`Login Error: ${error}`, {
    position: toast.POSITION.TOP_CENTER,
    autoClose: 3500
  });

  const notifyLoginInfo = (error) => toast.info(`${error}`, {
    position: toast.POSITION.TOP_CENTER,
    autoClose: 3500
  });

  const notifyLogout = () => toast.info("Logged out successfully", {
    position: toast.POSITION.TOP_CENTER,
    autoClose: 1700
  });

  const notifyTxSuccess = () => toast.success(<SuccessTx lastTxId={lastTxId} lastTxResp={lastTxResp} />, {
    position: toast.POSITION.TOP_CENTER,
    autoClose: 10000
  });

  const notifyTxError = () => toast.error(<ErrorTx lastTxId={lastTxId} lastTxResp={lastTxResp} />, {
    position: toast.POSITION.TOP_CENTER,
    autoClose: 10000
  });

  const notifyTxInfo = () => toast.info(<InfoMsg lastTxId={lastTxId} lastTxResp={lastTxResp} />, {
    position: toast.POSITION.TOP_CENTER,
    autoClose: 10000
  });

  const notifyTx = async (type, txResp, txId) => {
    setLastTxId(txId);
    setLastTxResp(txResp);

    if (type === 'success') {
      notifyTxSuccess();
    } else if (type === 'error') {
      notifyTxError();
    } else {
      notifyTxInfo();
    }
  }

  useEffect(() => {
    scatterInit();
  }, []);

  return (
    <Fragment>
      <div className={clsx('app-wrapper', contentBackground)}>
        <div
          className={clsx('app-content', {
            'app-content-footer-fixed': footerFixed
          })}>
          <div className="app-content--inner">
            <div className="app-content--inner__wrapper">
              <InfoBarHeader
                voteSentnl={voteSentnl}
                currentRamPriceBytes={currentRamPriceBytes}
                currentConnectionStatus={currentConnectionStatus} />
              <ToastContainer />


              <ScatterMissingNotification
                scatter={scatter}
                scatterLoading={scatterLoading}
              />

              <DashboardStatistics />


              <div className="row">
                {/*--- TV chart box ---*/}
                <div className="col-xl-8">
                  <Card className="m-b-30">
                    <div className="card-header"><h5>WAX/KB (RAM) Chart</h5></div>
                    <CardContent>
                      <TVChart />
                    </CardContent>
                  </Card>
                </div>
                {/*--- End TV chart box ---*/}

                {/*---Recent trades box ---*/}
                <div className="col-xl-4">
                  <Card className="m-b-30">
                    <div className="card-header recent-trades-header">
                      <span className="marketStatus">
                        <h5>Market History</h5>
                      </span>
                      <span className="marketStatus float-right">
                        <LastUpdateTime lastUpdateTimestamp={lastUpdateTimestamp} />
                      </span>
                    </div>
                    <CardContent>
                      <RecentTradesBox
                        recentTradesArray={recentTradesArray}
                        lastUpdateTimestamp={lastUpdateTimestamp}
                      />
                    </CardContent>
                  </Card>
                </div>
                {/*--- End recent trades box ---*/}

              </div>
              <TradePanel
                id="react-tradepanel"
                currentRamPriceBytes={currentRamPriceBytes}
                scatter={scatter}
                network={network}
                eosReqFields={eosReqFields}
                options={options}
                accRamQuota={accRamQuota}
                accRamUsed={accRamUsed}
                accBal={accBal}
                loggedInState={loggedInState}
                loginHandler={loginHandler}
                accStats_account_name={accStats_account_name}
                accStats_cpu_limit_available={accStats_cpu_limit_available}
                accStats_cpu_limit_max={accStats_cpu_limit_max}
                accStats_cpu_limit_used={accStats_cpu_limit_used}
                accStats_cpu_weight={accStats_cpu_weight}
                accStats_created={accStats_created}
                accStats_net_limit_available={accStats_net_limit_available}
                accStats_net_limit_max={accStats_net_limit_max}
                accStats_net_limit_used={accStats_net_limit_used}
                accStats_total_resources_cpu_weight={accStats_total_resources_cpu_weight}
                accStats_total_resources_net_weight={accStats_total_resources_net_weight}
                scatterLoading={scatterLoading}
                scatterEosObj={scatterEosObj}
                updateAccBal={updateAccBal}
                notifyTxSuccess={notifyTxSuccess}
                notifyTxError={notifyTxError}
                notifyTxInfo={notifyTxInfo}
                notifyTx={notifyTx}
              />

            </div>
          </div>
        </div>
        <FooterBar voteSentnl={voteSentnl} />
      </div>
    </Fragment>
  );

}


const mapStateToProps = state => ({
  sidebarToggle: state.ThemeOptions.sidebarToggle,
  sidebarToggleMobile: state.ThemeOptions.sidebarToggleMobile,
  sidebarFixed: state.ThemeOptions.sidebarFixed,

  headerFixed: state.ThemeOptions.headerFixed,
  headerSearchHover: state.ThemeOptions.headerSearchHover,
  headerDrawerToggle: state.ThemeOptions.headerDrawerToggle,

  footerFixed: state.ThemeOptions.footerFixed,

  contentBackground: state.ThemeOptions.contentBackground
});

export default connect(mapStateToProps)(Dashboard);

