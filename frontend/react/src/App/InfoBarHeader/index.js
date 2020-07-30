/*******************************
* Copyright 2018 Andrew Coutts
********************************/
import * as React from 'react';
import './index.css';

class CurrentRamPrice extends React.PureComponent {
  render() {

    if (!isNaN(this.props.currentRamPriceBytes)) {
      return (
        <div>
          <span className={this.props.priceFlashClass}>
            {(this.props.currentRamPriceBytes * 1024).toFixed(8)}
          </span> WAX/KB
        </div>
      );
    } else {
      return (
        <div className={this.props.priceFlashClass}>
          {this.props.currentRamPriceBytes}
        </div>
      );
    }
  }
}

class SocketConnectionStatus extends React.PureComponent {
  render() {
    let badgeType;
    switch (this.props.currentConnectionStatus) {
      case 'Connecting...':
        badgeType = 'badge-info';
        break;

      case 'Realtime':
        badgeType = 'badge-success';
        break;

      default:
        badgeType = 'badge-warning';
        break;
    }

    return (
      <span id="connectionStatus" className={`badge ${badgeType}`}>{this.props.currentConnectionStatus}</span>
    );
  }
}

class InfoBarHeader extends React.PureComponent {

  constructor(props) {
    super(props);
    this.state = {
      priceFlashClass: ''
    };

    this.updatePriceFlashClass = this.updatePriceFlashClass.bind(this);
  }

  updatePriceFlashClass(e) {
    this.setState({ priceFlashClass: e });
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    let updateType;
    let priceChange = this.props.currentRamPriceBytes - prevProps.currentRamPriceBytes;

    if (priceChange > 0) {
      updateType = 'increase';
      //~ console.log(`${updateType}: ${priceChange}`);
      this.updatePriceFlashClass(updateType);

      setTimeout(() => {
        //~ console.log(`Removing price change color`);
        this.updatePriceFlashClass('');
      }, 720);

    } else if (priceChange < 0) {
      updateType = 'decrease';
      //~ console.log(`${updateType}: ${priceChange}`);
      this.updatePriceFlashClass(updateType);

      setTimeout(() => {
        //~ console.log(`Removing price change color`);
        this.updatePriceFlashClass('');
      }, 720);

    }
  }

  render() {
    return (
      <div className="page-title-box">
        <div className="headerRow">
          <div>
            <img src="assets/images/sentnl-logo.svg" alt="EOS42" height="30px" style={{ marginRight: "8px" }} />
          </div>
          <div>
          <h4 className="page-title">SENTNL </h4>
          </div>
          <h4 className="page-title">  | waxram.sentnl.io</h4>
        </div>

        <div>
          <button onClick={() => this.props.voteSentnl()} type="button" className="btn btn-outline-danger w-md"><i className="fa fa-check" style={{marginRight: "10px"}}></i><b>Vote Sentnl</b></button>
        </div>

        <div className="statusInfo">
          <SocketConnectionStatus currentConnectionStatus={this.props.currentConnectionStatus} />
          <CurrentRamPrice
            priceFlashclassName={this.state.priceFlashClass}
            currentRamPriceBytes={this.props.currentRamPriceBytes}
          />
        </div>
      </div>
    );
  }
}

export default InfoBarHeader;
