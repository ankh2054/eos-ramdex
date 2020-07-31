/*******************************
* Copyright 2018 Andrew Coutts
********************************/
import React, { Fragment } from 'react';
import './index.css';
import clsx from 'clsx';
import { connect } from 'react-redux';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import {
  Paper,
  Box,
  Button,
} from '@material-ui/core';


import DashboardTwoToneIcon from '@material-ui/icons/DashboardTwoTone';


const ScatterMissingNotification = (props) => {

  const { scatter, scatterLoading,
    pageTitleStyle,
    pageTitleBackground,
    pageTitleShadow,
    pageTitleIconBox,
    pageTitleDescription} = props;

 
  
    const [showNotification, setShowNotification] = React.useState(true);
    const dismiss =  () => setShowNotification(false);

    if(showNotification){
      return (
        <Fragment>
         { showNotification ? <Paper
          square
          elevation={pageTitleShadow ? 6 : 2}
          className={clsx('app-page-title', pageTitleStyle, pageTitleBackground)}>
          <div>
            {(!scatter && scatterLoading) ?
              <Fragment>
                <i className="dripicons-search scatter-info-icon"></i>
                 Detecting Scatter...
                 </Fragment> : 
              <Box className="app-page-title--first">
                {pageTitleIconBox && (
                  <Paper
                    elevation={2}
                    className="app-page-title--iconbox d-70 d-flex align-items-center bg-secondary justify-content-center">
                    <DashboardTwoToneIcon />
                  </Paper>
                )}
                <div className="app-page-title--heading">
                  <h1>Detecting Scatter...</h1>
                  {pageTitleDescription && (
                    <div className="app-page-title--description">
                        Heads up! It looks like you don't have Scatter installed in your browser. Please visit the <a href="https://get-scatter.com/" target="_new" alt="">Scatter Website</a> to get Scatter Desktop to enable the trading features
                    </div>
                  )}
                </div>
              </Box> }
          </div>
    
          <div className="d-flex align-items-center">
                <Button onClick={dismiss} variant="contained" color="secondary">
                  <span className="d-none d-xl-block">Dismiss</span>
                  <span className="btn-wrapper--icon d-block d-xl-none">
                    <FontAwesomeIcon icon={['far', 'object-group']} />
                  </span>
                </Button>
           </div>
        </Paper> : null }
        
        </Fragment>
      );
    }

    return null;

  

}

const mapStateToProps = state => ({
  pageTitleStyle: state.ThemeOptions.pageTitleStyle,
  pageTitleBackground: state.ThemeOptions.pageTitleBackground,
  pageTitleShadow: state.ThemeOptions.pageTitleShadow,
  pageTitleBreadcrumb: state.ThemeOptions.pageTitleBreadcrumb,
  pageTitleIconBox: state.ThemeOptions.pageTitleIconBox,
  pageTitleDescription: state.ThemeOptions.pageTitleDescription
});

export default connect(mapStateToProps)(ScatterMissingNotification);

