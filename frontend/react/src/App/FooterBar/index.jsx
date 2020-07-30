/*******************************
* Copyright 2018 Andrew Coutts
********************************/
import * as React from 'react';
import './index.css';

class FooterBar extends React.PureComponent {
	render() {
    return(
      <div className="container-fluid">
        <div className="row">
          <div className="col-12 text-center">
            2020 | By <a href="https://sentnl.io" rel="noopener noreferrer" target="_blank">Sentnl</a> | <a href="https://t.me/sentnl" target="_blank" rel="noopener noreferrer"><i className="fab fa-telegram"></i></a> | <button onClick={() => this.props.voteSentnl()} type="button" className="btn btn-primary w-md"><i className="fa fa-check" style={{marginRight: "10px"}}></i><b>Vote Sentnl</b></button>
          </div>
        </div>
      </div>
    );
  }
}

export default FooterBar;
