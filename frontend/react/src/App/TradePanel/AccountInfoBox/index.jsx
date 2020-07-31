/*******************************
* Copyright 2018 Andrew Coutts
********************************/
import React, { Fragment } from 'react';
import './index.css';
import { isMobile } from 'react-device-detect';
import {
	Card,
	CardContent
  } from '@material-ui/core';

const ScatterStatus = (props) => {
	const { loggedIn } = props;

	let className = "badge badge-light";
	let label = "Logged Out";
	if (loggedIn === 1) {
		className = "badge badge-warning"
		label = "Logging In...";
	} else if (loggedIn === 2) {
		className = "badge badge-success"
		label = "Logged In";
	}

	return (
		<span className={className}>{label}</span>
	);

}

const ScatterLoginButton = (props) => {

	const { loggedIn, loginHandler, scatter, scatterLoading } = props;


	if (isMobile) {
		return <button type="button" className="btn btn-light w-md" id="btn-scatterlogin" disabled><i className="dripicons-download login-btn-icons"></i> Get Scatter</button>
	}

	if (scatterLoading) {
		return <button type="button" className="btn btn-primary w-md" disabled id="btn-scatterlogin"><i className="dripicons-loading login-btn-icons"></i> Initializing..</button>
	} else {
		if (!scatter) {
			//~ Done loading scatter but the user doesn't have it, style it to say 'get scatter'
			return <button type="button" className="btn btn-primary w-md" id="btn-scatterlogin" onClick={loginHandler}><i className="dripicons-forward login-btn-icons"></i> Get Scatter</button>
		} else {
			if (loggedIn === 1) {
				//logging in
				return <button type="button" className="btn btn-primary w-md" disabled id="btn-scatterlogin" onClick={loginHandler}><i className="dripicons-loading login-btn-icons"></i> Logging in..</button>
			} else if (loggedIn === 2) {
				// logged in
				return <button type="button" className="btn btn-outline-light w-md" id="btn-scatterlogin" onClick={loginHandler}><i className="dripicons-exit login-btn-icons"></i> Logout</button>
			} else {
				// logged out
				return <button type="button" className="btn btn-primary w-md" id="btn-scatterlogin" onClick={loginHandler}><i className="mdi mdi-login login-btn-icons"></i> Login with Scatter</button>
			}
		}
	}


}

const UtilizationBar = (props) => {

	const { value } = props;
	let className;
	if (value > 80) {
		//~ warning
		className = 'bg-danger';
	} else if (value > 40) {
		//~ critical
		className = 'bg-warning';
	} else {
		//~ info
		className = 'bg-info';
	}

	return (
		<div>
			<span>{props.title}: </span><div className="progress mb-2 progress-lg mb-2">
				<div className={`progress-bar ${className}`} role="progressbar" style={{ width: String(value + '%') }} aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
					<small className="justify-content-center d-flex position-absolute w-100">{value}%</small>
				</div>
			</div>
		</div>
	)

};

const AccResourceUtilizations = (props) => {

	let cpumax = props.accStats_cpu_limit_max;
	let cpuused = props.accStats_cpu_limit_used;
	let cpup = ((cpuused / cpumax) * 100).toFixed(2);

	let netmax = props.accStats_net_limit_max;
	let netused = props.accStats_net_limit_used;
	let netp = ((netused / netmax) * 100).toFixed(2);

	let rammax = props.accRamQuota;
	let ramused = props.accRamUsed;
	let ramp = ((ramused / rammax) * 100).toFixed(2);

	//~ console.log(`${rammax} | ${ramused} | ${ramp}`);

	if ((props.loggedIn === 2) && cpup && netp && ramp) {
		//~ Logged in
		return (
			<div>
				<UtilizationBar
					title="CPU Utilization"
					value={cpup}
				/>
				<UtilizationBar
					title="NET Utilization"
					value={netp}
				/>
				<UtilizationBar
					title="RAM Utilization"
					value={ramp}
				/>
			</div>
		);
	} else {
		return null;
	}

}

const ScatterAccountInfo = (props) => {
	let sellableBytes = props.accRamQuota - props.accRamUsed;
	let parsedAccBal;
	if (props.accBal) {
		parsedAccBal = props.accBal.substr(0, props.accBal.indexOf(' '));
	} else {
		parsedAccBal = 0;
	}

	if (props.loggedIn === 2) {
		return (
			<div>
				<ul className="list-group list-group-flush" id="scatter-account-summary">
					<li className="list-group-item list-group-item-accname" id="info-scatter-identityname">Account: <b>{props.scatter.identity.accounts[0].name}</b></li>
					<li className="list-group-item list-group-item-accname" id="info-scatter-eosbalance">WAX Balance: <b>{parsedAccBal}</b></li>
					<li className="list-group-item list-group-item-accname" id="info-scatter-rambytes">Sellable Bytes: <b>{sellableBytes.toLocaleString(navigator.language, { minimumFractionDigits: 0 })} Bytes</b></li>
				</ul>
			</div>
		);
	} else {
		return null;
	}

}


const AccountInfoBox = (props) => {


	return (
		<div className="col-xl-4">
			<Card className="m-b-30" id={props.id}>
				<div className="card-header">
					<div id="scatter-connstatus">
						<img src="assets/images/scatter.png" id="scatterlogo" alt="" />
						<ScatterStatus loggedIn={props.loggedIn}
						/>
					</div>
					<div id="scatterauth">
						<ScatterLoginButton
							loginHandler={props.loginHandler}
							loggedIn={props.loggedIn}
							scatterLoading={props.scatterLoading}
							scatter={props.scatter}
						/>
					</div>
				</div>
				<CardContent>
					<ul className="list-group list-group-flush">
						<li className="list-group-item list-group-item-acctinfo">
							<div className="row">
								<div className="col">
									<AccResourceUtilizations
										loggedIn={props.loggedIn}
										accRamQuota={props.accRamQuota}
										accRamUsed={props.accRamUsed}
										accStats_cpu_limit_max={props.accStats_cpu_limit_max}
										accStats_cpu_limit_used={props.accStats_cpu_limit_used}
										accStats_net_limit_used={props.accStats_net_limit_used}
										accStats_net_limit_max={props.accStats_net_limit_max}
									/>
								</div>
								<div className="col">
									<ScatterAccountInfo scatter={props.scatter}
										loggedIn={props.loggedIn}
										accBal={props.accBal}
										accRamQuota={props.accRamQuota}
										accRamUsed={props.accRamUsed}
									/>
								</div>
							</div>
						</li>
					</ul>
				</CardContent>
			</Card>
		</div>
	);

}

export default AccountInfoBox;
