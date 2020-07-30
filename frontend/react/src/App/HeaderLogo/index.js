import React, { Fragment } from 'react';

import clsx from 'clsx';
import { connect } from 'react-redux';

import { IconButton, Box } from '@material-ui/core';



const HeaderLogo = props => {
  const { sidebarToggle, sidebarHover } = props;
  return (
    <Fragment>
      <div
        className={clsx('app-header-logo', {
          'app-header-logo-close': sidebarToggle,
          'app-header-logo-open': sidebarHover
        })}>
        <Box
          className="header-logo-wrapper"
          title="SENTNL | waxram.sentnl.io">
            <IconButton
              color="primary"
              size="medium"
              className="header-logo-wrapper-btn">
              <img
                className="app-header-logo-img"
                alt="SENTNL | waxram.sentnl.io"
                src="assets/images/sentnl-logo.svg" 
              />
            </IconButton>
          <Box className="header-logo-text">
               SENTNL | waxram.sentnl.io
          </Box>
        </Box>
      </div>
    </Fragment>
  );
};

const mapStateToProps = state => ({
  sidebarToggle: state.ThemeOptions.sidebarToggle,
  sidebarHover: state.ThemeOptions.sidebarHover
});

export default connect(mapStateToProps)(HeaderLogo);
