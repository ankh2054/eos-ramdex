/*******************************
* Copyright 2018 Andrew Coutts
********************************/
import * as React from 'react';
import './index.css';

class ScatterMissingNotification extends React.PureComponent {

  render() {
    if (!this.props.scatter) {
      if (this.props.scatterLoading) {
        return (
          <div className={`alert alert-info alert-dismissible bg-info text-white border-0 fade show`} role="alert">
            <button type="button" className="close" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true" className="dismissbtn">×</span>
            </button>
            <i className="dripicons-search scatter-info-icon"></i>
             Detecting Scatter...
          </div>
        );
      } else {
        return (
          <div className={`alert alert-primary alert-dismissible bg-primary text-white border-0 fade show`} role="alert">
            <button type="button" className="close" data-dismiss="alert" aria-label="Close">
              <span aria-hidden="true" className="dismissbtn">×</span>
            </button>
             <i className="mdi mdi-information scatter-info-icon"></i>
             Heads up! It looks like you don't have Scatter installed in your browser. Please visit the <a href="https://get-scatter.com/" target="_new" alt="">Scatter Website</a> to get Scatter Desktop to enable the trading features
          </div>
        );
      }
    } else {
      return (
        <div/>
      );
    }
  }
}
export default ScatterMissingNotification;
