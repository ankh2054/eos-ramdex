/*******************************
* Copyright 2018 Andrew Coutts
********************************/
import React, {  useEffect, Fragment } from 'react';
import { Hidden, IconButton, AppBar, Box, Tooltip } from '@material-ui/core';

import {
  setSidebarToggle,
  setSidebarToggleMobile
} from '../../reducers/ThemeOptions';

import HeaderLogo from '../HeaderLogo';
import HeaderDots from '../HeaderDots';
import HeaderDrawer from '../HeaderDrawer';
import HeaderUserbox from '../HeaderUserbox';
import HeaderSearch from '../HeaderSearch';
import HeaderMenu from '../HeaderMenu';

import projectLogo from '../../assets/images/sentnl-logo.svg';

import { connect } from 'react-redux';

import MenuOpenRoundedIcon from '@material-ui/icons/MenuOpenRounded';
import MenuRoundedIcon from '@material-ui/icons/MenuRounded';

import clsx from 'clsx';
import './index.css';

const CurrentRamPrice = (props) => {
  const { currentRamPriceBytes, priceFlashClass } = props;
  return (
    <div>
      <span className={priceFlashClass}>
        {!isNaN(currentRamPriceBytes) ? (currentRamPriceBytes * 1024).toFixed(8) : currentRamPriceBytes}
      </span> {!isNaN(currentRamPriceBytes) ? 'WAX/KB' : ''}
    </div>
  );
};

const SocketConnectionStatus = (props) => {
  const { currentConnectionStatus } = props;
  let badgeType = 'badge-warning';
  switch (currentConnectionStatus) {
    case 'Connecting...':
      badgeType = 'badge-info';
      break;

    case 'Realtime':
      badgeType = 'badge-success';
      break;
  }
  return (
    <span id="connectionStatus" className={`badge ${badgeType}`}>{currentConnectionStatus}</span>
  );
};

const InfoBarHeader = (props) => {
  let priceFlashClass ='';
  const {
    currentRamPriceBytes,
    currentConnectionStatus,
    headerShadow,
    headerFixed,
    sidebarToggleMobile,
    setSidebarToggleMobile,
    setSidebarToggle,
    sidebarToggle
  } = props;
 

  const toggleSidebar = () => {
    setSidebarToggle(!sidebarToggle);
  };

  const toggleSidebarMobile = () => {
    setSidebarToggleMobile(!sidebarToggleMobile);
  };


  const updatePriceFlashClass = (e) => {
    priceFlashClass=e;
  };

  useEffect(() => {
    let updateType = 'increase';
    if (currentRamPriceBytes < 0) {
      updateType = 'decrease';
    }

    updatePriceFlashClass(updateType);
    setTimeout(() => {
      updatePriceFlashClass('');
    }, 720);
  }, [currentRamPriceBytes]);

  


  return (
    <Fragment>
      <AppBar
        color="secondary"
        className={clsx('app-header', {
          'app-header-collapsed-sidebar': props.isCollapsedLayout
        })}
        position={headerFixed ? 'fixed' : 'absolute'}
        elevation={headerShadow ? 11 : 3}>
        {!props.isCollapsedLayout && <HeaderLogo />}
        <Box className="app-header-toolbar">
          <Hidden lgUp>
            <Box
              className="app-logo-wrapper"
              title="SENTNL | waxram.sentnl.io">
              <IconButton
                color="primary"
                size="medium"
                className="app-logo-btn">
                <img
                  className="app-logo-img"
                  alt="SENTNL | waxram.sentnl.io"
                  src={projectLogo}
                />
              </IconButton>
              <Hidden smDown>
                <Box className="app-logo-text">SENTNL | waxram.sentnl.io</Box>
              </Hidden>
            </Box>
          </Hidden>
         <Hidden mdDown>
            <Box className="d-flex align-items-center">
              {!props.isCollapsedLayout && (
                <Box
                  className={clsx('btn-toggle-collapse', {
                    'btn-toggle-collapse-closed': sidebarToggle
                  })}>
                  
                </Box>
              )}
            
            </Box>
          </Hidden>
         <Box className="d-flex align-items-center">
            <div className="statusInfo">
             
          <SocketConnectionStatus currentConnectionStatus={currentConnectionStatus} />
              <CurrentRamPrice
                priceFlashclassName={priceFlashClass}
                currentRamPriceBytes={currentRamPriceBytes}
              />
            </div>
            {/* <HeaderDots />
            <HeaderUserbox />
            <HeaderDrawer />
            <Box className="toggle-sidebar-btn-mobile">
              <Tooltip title="Toggle Sidebar" placement="right">
                <IconButton
                  color="inherit"
                  onClick={toggleSidebarMobile}
                  size="medium">
                  {sidebarToggleMobile ? (
                    <MenuOpenRoundedIcon />
                  ) : (
                      <MenuRoundedIcon />
                    )}
                </IconButton>
              </Tooltip>
            </Box> */}
          </Box> 
          
        </Box>

      </AppBar>
    </Fragment>


  );
}

// export default InfoBarHeader;


const mapStateToProps = state => ({
  headerShadow: state.ThemeOptions.headerShadow,
  headerFixed: state.ThemeOptions.headerFixed,
  sidebarToggleMobile: state.ThemeOptions.sidebarToggleMobile,
  sidebarToggle: state.ThemeOptions.sidebarToggle
});

const mapDispatchToProps = dispatch => ({
  setSidebarToggle: enable => dispatch(setSidebarToggle(enable)),
  setSidebarToggleMobile: enable => dispatch(setSidebarToggleMobile(enable))
});

export default connect(mapStateToProps, mapDispatchToProps)(InfoBarHeader);