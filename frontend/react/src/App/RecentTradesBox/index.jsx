/*******************************
* Copyright 2018 Andrew Coutts
********************************/
import * as React from 'react';
import './index.css';

class RecentTradesBox extends React.PureComponent {

  componentWillUnmount() {
    //~ console.log(`unmounting RecentTradesBox`);
  }

  render() {
    return (
      <div className="recentorders-outer">
        <div className="recentorders-inner card-body">
          <table className="table table-sm mb-0">
            <thead className="tableHeader">
              <tr>
                <td className={"tradeColRight"}>Quantity (WAX)</td>
                <td className="tradeColCenter">Account</td>
                <td className="tradeColCenter">Time</td>
              </tr>
            </thead>
            <tbody className="recentorders">
              {this.props.recentTradesArray.map((trade) =>
                <tr key={trade.txid} onClick={() => window.open(`https://wax.bloks.io/transaction/${trade.txid}`, "_blank")}>
                  <td className={`tradeColRight tradeColQuant ${trade.type}`}>{trade.quantity}</td>
                  <td className="tradeColCenter">{trade.user}</td>
                  <td className="tradeColCenter">{trade.timestamp}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

}

export default RecentTradesBox
