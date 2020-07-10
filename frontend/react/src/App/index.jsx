/*******************************
* Copyright 2018 Andrew Coutts
********************************/
import * as React from 'react';
import './index.css';
import TVChart from './TVChart';
import TradePanel from './TradePanel';
import RecentTradesBox from './RecentTradesBox';
import InfoBarHeader from './InfoBarHeader';
import FooterBar from './FooterBar';
import ScatterMissingNotification from './ScatterMissingNotification';
import stream from './TVChart/api/stream';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import moment from 'moment';
import ScatterJS from "scatterjs-core"
import ScatterEOS from "scatterjs-plugin-eosjs2"
import { JsonRpc, Api } from "eosjs"

// Configure Scatter
ScatterJS.plugins(new ScatterEOS())


class ErrorTx extends React.PureComponent {
  render() {
    return (
      <div>
        <h5>Error:</h5> <p>{this.props.lastTxResp}</p>
      </div>
    );
  }
}

class SuccessTx extends React.PureComponent {
  render() {
    let blockExpUrl = `https://eosflare.io/tx/${this.props.lastTxId}`;
    let shortString = (this.props.lastTxId).substring(0,30);
    return (
      <div>
        <h5>{this.props.lastTxResp}:</h5> <a className="successMsg" href={blockExpUrl} target="_blank">{shortString}...</a>
      </div>
    );
  }
}

class InfoMsg extends React.PureComponent {
  render() {
    return (
      <div>
        <h5>Info:</h5> <p>{this.props.lastTxResp}</p>
      </div>
    );
  }
}

class LastUpdateTime extends React.PureComponent {
  render() {
    if (this.props.lastUpdateTimestamp) {
      return (
        <strong>{moment.utc(this.props.lastUpdateTimestamp).format('YYYY-MM-DD HH:mm:ss')}</strong>
      );
    } else {
      return (
        null
      );
    }
  }
}

class App extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      loggedInState: null,
      currentRamPriceBytes: 'Loading..',
      scatter: null,
      accBal: null,
      accRamQuota: null,
      accRamUsed: null,
      recentTradesArray: [],
      lastKnownTradesAraryTx: null,
      currentConnectionStatus: 'Connecting...',
      scatterLoading: true,
      lastUpdateTimestamp: null,
      scatterEosObj: null,
      voterInfo: null,
    };

    this.setLoggedIn = this.setLoggedIn.bind(this);
    this.setScatter = this.setScatter.bind(this);
    this.handleNewPriceChange = this.handleNewPriceChange.bind(this);
    this.handleNewTradesChange = this.handleNewTradesChange.bind(this);
    this.updateAccBal = this.updateAccBal.bind(this);
    this.handleSocketConnectionStatus = this.handleSocketConnectionStatus.bind(this);
    this.updateScatterLoading = this.updateScatterLoading.bind(this);
    stream.subscribeFrontend(this.handleNewPriceChange, this.handleNewTradesChange, this.handleSocketConnectionStatus);
  }

  updateInterval = null

  rpc = new JsonRpc(process.env.api_node || "https://chain.wax.io:443", { fetch })

  network = ScatterJS.Network.fromJson({
    blockchain: 'eos',
    chainId: '1064487b3cd1a897ce03ae5b6a865651747e2e152090f99c1d19d44e01aea5a4',
    host: 'chain.wax.io',
    port: 443,
    protocol: 'https'
  });

  /*******************************
  * State setting functions
  ********************************/
  setScatterEosObj() {
    // console.log("setScatterEosObj")
    this.setState({ scatterEosObj: ScatterJS.eos(this.network, Api, { rpc: new JsonRpc(process.env.REACT_APP_API_NODE || "https://chain.wax.io:443"), beta3: true }) })
  }

  updateScatterLoading(e) {
    this.setState({ scatterLoading: e });
  }

  handleNewPriceChange(data) {
    //~ console.log(`Handling update for chart`);
    this.setState({
      currentRamPriceBytes: data.price,
      lastUpdateTimestamp: data.timestamp
    });
  }

  handleNewTradesChange(tradesArray) {
    //~ console.log(`Handling update for trades`);
    if (this.state.lastKnownTradesAraryTx !== tradesArray[0].txid) {
      //console.log('trades array updated');
      this.setState({ recentTradesArray: tradesArray });
      this.setState({ lastKnownTradesAraryTx: tradesArray[0].txid });
    }
  }

  handleSocketConnectionStatus(_status) {
    this.setState({ currentConnectionStatus: _status });
  }

  setScatter(e) {
    this.setState({ scatter: e });
  }

  setLoggedIn(e) {
    this.setState({ loggedInState: e });

    switch (e) {
      case 0:
        this.notifyLogout();
        this.setState({
          accBal: '0 EOS',
          accRamQuota: 0,
          accRamUsed: 0
        });
        break;

      case 1:

        break;

      case 2:
        this.notifyLogin();
        break;

      case 3:
        this.notifyLoginInfo('Please unlock your Scatter wallet and try again');
        break;

      case 4:
        this.notifyLoginInfo('Login request cancelled');
        break;

      default:
        this.notifyLoginError(e);
        //console.log(e);
        break;
    }
  }

  async updateAccBal() {
    if (!this.state.scatterEosObj) {
      console.log("this.state.scatterEosObj null, returning")
      return;
    }

    const res = await this.rpc.get_account(this.state.scatter.account("eos").name)
    console.log(res);
    this.setState({
      accBal: res.core_liquid_balance,
      accRamQuota: res.ram_quota,
      accRamUsed: res.ram_usage,
      accStats_account_name: res.account_name,
      accStats_cpu_limit_available: res.cpu_limit.available,
      accStats_cpu_limit_max: res.cpu_limit.max,
      accStats_cpu_limit_used: res.cpu_limit.used,
      accStats_cpu_weight: res.cpu_weight,
      accStats_created: res.created,
      accStats_net_limit_available: res.net_limit.available,
      accStats_net_limit_max: res.net_limit.max,
      accStats_net_limit_used: res.net_limit.used,
      accStats_total_resources_cpu_weight: res.total_resources.cpu_weight,
      accStats_total_resources_net_weight: res.total_resources.net_weight,
      voterInfo: res.voter_info,
    });
  }

  /*-----------------------------------*/

  loginHandler = (e) => {
    //~ console.log(`login handler`);
    e.preventDefault();
    if (this.state.loggedInState === 2) {
      this.scatterLogout();
    } else {
      this.scatterLogin();
    }
  }

  voteSentnl = async () => {
    if (this.state.loggedInState !== 2) {
      this.notifyTx("error", "Please log in first", null)
      return
    }

    let votersArray = []

    if (this.state.voterInfo) {
      if (Object.prototype.hasOwnProperty.call(this.state.voterInfo, "producers")) {
        if (this.state.voterInfo.length === 30) {
          // If the user already has 30 producers, replace the last one
          votersArray.concat(this.state.voterInfo.filter((e) => this.state.voterInfo.indexOf(e) !== this.state.voterInfo.length - 1))
        }
      }
    }

    // Add eos42freedom
    votersArray.push("sentnlagents")
    
    try {
      const result = await this.state.scatterEosObj.transact(
        {
          actions: [
            {
              account: "eosio",
              name: "voteproducer",
              authorization: [
                {
                  actor: this.state.scatter.account("eos").name,
                  permission: this.state.scatter.account("eos").authority,
                },
              ],
              data: {
                voter: this.state.scatter.account("eos").name,
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
      this.notifyTx("success", "Transaction Successful", result.processed.id)
    } catch(e) {
      console.log(e.message)
      this.notifyTx("error",  e.message.slice(0, 1).toUpperCase().concat(e.message.slice(1, e.message.length)), null)
    }
  }

  scatterLogin = async () => {
    if (!this.state.scatter) {
      //~ console.log('scatter is missing');
      window.open('https://get-scatter.com/', '_blank');
      return;
    }
    this.setLoggedIn(1); // logging in?
    await this.state.scatter.suggestNetwork(this.network)

    //~ console.log(`loginHandler: currently logged out, processing login`);
    //~ console.log(`Scatter: Getting identity..`);
    try {
      //~ console.log(`Attempting to login`);
      //~ const identityResult = await this.state.scatter.getIdentity({accounts: [network]});
      //~ console.log(identityResult);
      const identityResult = await this.state.scatter.getIdentity({ accounts: [this.network] })
      if (identityResult) {
        this.setLoggedIn(2);
        // console.log("Starting account update interval")
        await this.updateAccBal()
        this.updateInterval = setInterval(async () => await this.updateAccBal(), 5000);
      }
    } catch (e) {
      //~ console.log(`///////////// Caught error in login`);
      console.log(e);
      if (e.type === 'locked') {
        //~ console.log(`processing locked scatter request`);
        this.setLoggedIn(3);
      } else if (e.type === 'identity_rejected') {
        this.setLoggedIn(4);
      } else {
        this.setLoggedIn(e.message);
      }
    }
    //~ console.log(`Scatter: Authenticating identity..`);

    //~ console.log(this.state.scatter.identity.accounts[0]);
    //~ console.log(this.state.scatter.identity.accounts[0]);
    //~ Update account balance
  }

  scatterLogout = () => {
    //~ console.log(`loginHandler: currently logged in, processing logout`);
    this.state.scatter.forgetIdentity();
    this.setLoggedIn(0);
    clearInterval(this.updateInterval)
  }

  scatterInit = async () => {
    try {
      const result = await ScatterJS.scatter.connect(`waxram.sentnl.io`, { initTimeout: 15000 })
      if (result) {
        this.setScatter(ScatterJS.scatter)
        this.updateScatterLoading(false)
        window.scatter = null
        this.setScatterEosObj();
      } else {
        console.log("Warning: Scatter Desktop not found.")
        this.updateScatterLoading(false)
      }
    } catch (e) {
      console.error("Error while hooking Scatter: ", e)
      this.updateScatterLoading(false)
    }
  }

  notifyLogin = () => toast.success("Successfully logged in", {
    position: toast.POSITION.TOP_CENTER,
    autoClose: 1700
  });

  notifyLoginError = (error) => toast.error(`Login Error: ${error}`, {
    position: toast.POSITION.TOP_CENTER,
    autoClose: 3500
  });

  notifyLoginInfo = (error) => toast.info(`${error}`, {
    position: toast.POSITION.TOP_CENTER,
    autoClose: 3500
  });

  notifyLogout = () => toast.info("Logged out successfully", {
    position: toast.POSITION.TOP_CENTER,
    autoClose: 1700
  });

  notifyTxSuccess = () => toast.success(<SuccessTx lastTxId={this.state.lastTxId} lastTxResp={this.state.lastTxResp}/>, {
    position: toast.POSITION.TOP_CENTER,
    autoClose: 10000
  });

  notifyTxError = () => toast.error(<ErrorTx lastTxId={this.state.lastTxId} lastTxResp={this.state.lastTxResp}/>, {
    position: toast.POSITION.TOP_CENTER,
    autoClose: 10000
  });

  notifyTxInfo = () => toast.info(<InfoMsg lastTxId={this.state.lastTxId} lastTxResp={this.state.lastTxResp}/>, {
    position: toast.POSITION.TOP_CENTER,
    autoClose: 10000
  });

  async notifyTx(type, txResp, txId) {
    await this.setState({
      lastTxId: txId,
      lastTxResp: txResp
    });

    if (type === 'success') {
      this.notifyTxSuccess();
    } else if (type === 'error' ) {
      this.notifyTxError();
    } else {
      this.notifyTxInfo();
    }
  }

  componentDidMount() {
    this.scatterInit()
  }

  render() {
    return (
      <div>
        <ToastContainer />
        <div className="wrapper">
          <div className="container-fluid">
            <InfoBarHeader
              voteSentnl={this.voteSentnl}
              currentRamPriceBytes={this.state.currentRamPriceBytes}
              currentConnectionStatus={this.state.currentConnectionStatus}
            />
            <div className="container-fluid">
              <ScatterMissingNotification
                scatter={this.state.scatter}
                scatterLoading={this.state.scatterLoading}
              />
            </div>

            <div className="row">
              {/*--- TV chart box ---*/}
              <div className="col-xl-8">
                <div className="card m-b-30">
                  <div className="card-header"><h5>WAX/KB (RAM) Chart</h5></div>
                  <div className="card-body">
                    <TVChart />
                  </div>
                </div>
              </div>
              {/*--- End TV chart box ---*/}

              {/*---Recent trades box ---*/}
              <div className="col-xl-4">
                <div className="card m-b-30">
                  <div className="card-header recent-trades-header">
                    <span className="marketStatus">
                      <h5>Market History</h5>
                    </span>
                    <span className="marketStatus float-right">
                      <LastUpdateTime lastUpdateTimestamp={this.state.lastUpdateTimestamp} />
                    </span>
                  </div>
                  <RecentTradesBox
                    recentTradesArray={this.state.recentTradesArray}
                    lastUpdateTimestamp={this.state.lastUpdateTimestamp}
                  />
                </div>
              </div>
              {/*--- End recent trades box ---*/}

            </div>
            <TradePanel
              id="react-tradepanel"
              currentRamPriceBytes={this.state.currentRamPriceBytes}
              scatter={this.state.scatter}
              network={this.network}
              eosReqFields={this.eosReqFields}
              options={this.options}
              accRamQuota={this.state.accRamQuota}
              accRamUsed={this.state.accRamUsed}
              accBal={this.state.accBal}
              loggedInState={this.state.loggedInState}
              loginHandler={this.loginHandler}
              accStats_account_name={this.state.accStats_account_name}
              accStats_cpu_limit_available={this.state.accStats_cpu_limit_available}
              accStats_cpu_limit_max={this.state.accStats_cpu_limit_max}
              accStats_cpu_limit_used={this.state.accStats_cpu_limit_used}
              accStats_cpu_weight={this.state.accStats_cpu_weight}
              accStats_created={this.state.accStats_created}
              accStats_net_limit_available={this.state.accStats_net_limit_available}
              accStats_net_limit_max={this.state.accStats_net_limit_max}
              accStats_net_limit_used={this.state.accStats_net_limit_used}
              accStats_total_resources_cpu_weight={this.state.accStats_total_resources_cpu_weight}
              accStats_total_resources_net_weight={this.state.accStats_total_resources_net_weight}
              scatterLoading={this.state.scatterLoading}
              scatterEosObj={this.state.scatterEosObj}
              updateAccBal={this.updateAccBal}
              notifyTxSuccess={this.notifyTxSuccess}
              notifyTxError={this.notifyTxError}
              notifyTxInfo={this.notifyTxInfo}
              notifyTx={this.notifyTx}
            />
          </div>
        </div>

        <footer className="footer">
          <FooterBar voteSentnl={this.voteSentnl} />
        </footer>
      </div>
    );
  }
}

export default App;
