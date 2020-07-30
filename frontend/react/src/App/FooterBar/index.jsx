/*******************************
* Copyright 2018 Andrew Coutts
********************************/
import React, { Fragment } from 'react';
import clsx from 'clsx';


import { Paper } from '@material-ui/core';

import { connect } from 'react-redux';
import './index.css';

const FooterBar = (props) => {

  const { footerShadow, sidebarToggle, footerFixed, voteSentnl } = props;


  return (
    <Fragment>
      <Paper
        square
        elevation={footerShadow ? 11 : 2}
        className={clsx('app-footer text-black-50', {
          'app-footer--fixed': footerFixed,
          'app-footer--fixed__collapsed': sidebarToggle
        })}>
        <div className="app-footer--inner">
            <div className="col-12 text-center">
              2020 | By <a href="https://sentnl.io" rel="noopener noreferrer" target="_blank">Sentnl</a> | <a href="https://t.me/sentnl" target="_blank" rel="noopener noreferrer"><i className="fab fa-telegram"></i></a> | <button onClick={voteSentnl} type="button" className="btn btn-primary w-md"><i className="fa fa-check" style={{ marginRight: "10px" }}></i><b>Vote Sentnl</b></button>
            </div>
        </div>
      </Paper>
    </Fragment>
  );
}

const mapStateToProps = state => ({
  footerFixed: state.ThemeOptions.footerFixed,
  footerShadow: state.ThemeOptions.footerShadow,
  sidebarToggle: state.ThemeOptions.sidebarToggle
});
export default connect(mapStateToProps)(FooterBar);

