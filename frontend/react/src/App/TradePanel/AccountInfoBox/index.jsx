/*******************************
* Copyright 2018 Andrew Coutts
********************************/
import * as React from 'react';
import './index.css';
import {isMobile} from 'react-device-detect';

class ScatterStatus extends React.PureComponent {
	render() {

		if (this.props.loggedIn === 1) {
			//logging in
			return (
				<span className="badge badge-warning">Logging In...</span>
			);
		} else if (this.props.loggedIn === 2) {
			// logged in
			return (
				<span className="badge badge-success">Logged In</span>
			);
		} else {
			// logged out
			return (
				<span className="badge badge-light">Logged Out</span>
			);
		}
	}
}

class ScatterLoginButton extends React.PureComponent {
	render() {
		if (isMobile) {
			return (
				<button type="button" className="btn btn-light w-md" id="btn-scatterlogin" disabled><i className="dripicons-download login-btn-icons"></i> Get Scatter</button>
			)
		}

		if (this.props.scatterLoading) {
			return (
				<button type="button" className="btn btn-primary w-md" disabled id="btn-scatterlogin"><i className="dripicons-loading login-btn-icons"></i> Initializing..</button>
			);
		} else {
			if (!this.props.scatter) {
				//~ Done loading scatter but the user doesn't have it, style it to say 'get scatter'
				return (
					<button type="button" className="btn btn-primary w-md" id="btn-scatterlogin" onClick={this.props.loginHandler}><i className="dripicons-forward login-btn-icons"></i> Get Scatter</button>
				);
			} else {
				if (this.props.loggedIn === 1) {
					//logging in
					return (
						<button type="button" className="btn btn-primary w-md" disabled id="btn-scatterlogin" onClick={this.props.loginHandler}><i className="dripicons-loading login-btn-icons"></i> Logging in..</button>
					);
				} else if (this.props.loggedIn === 2) {
					// logged in
					return (
						<button type="button" className="btn btn-outline-light w-md" id="btn-scatterlogin" onClick={this.props.loginHandler}><i className="dripicons-exit login-btn-icons"></i> Logout</button>
					);
				} else {
					// logged out
					return (
						<button type="button" className="btn btn-primary w-md" id="btn-scatterlogin" onClick={this.props.loginHandler}><i className="mdi mdi-login login-btn-icons"></i> Login with Scatter</button>
					);
				}
			}
		}




	}
}

class UtilizationBar extends React.PureComponent {
	render() {
		let value = this.props.value;
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
				<span>{this.props.title}: </span><div className="progress mb-2 progress-lg mb-2">
					<div className={`progress-bar ${className}`} role="progressbar" style={{width: String(this.props.value + '%')}} aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">
						<small className="justify-content-center d-flex position-absolute w-100">{this.props.value}%</small>
					</div>
				</div>
			</div>
		)
	}
}

class AccResourceUtilizations extends React.PureComponent {
	render() {
		let cpumax = this.props.accStats_cpu_limit_max;
		let cpuused = this.props.accStats_cpu_limit_used;
		let cpup = ((cpuused / cpumax)*100).toFixed(2);

		let netmax = this.props.accStats_net_limit_max;
		let netused = this.props.accStats_net_limit_used;
		let netp = ((netused / netmax)*100).toFixed(2);

		let rammax = this.props.accRamQuota;
		let ramused = this.props.accRamUsed;
		let ramp = ((ramused / rammax)*100).toFixed(2);

		//~ console.log(`${rammax} | ${ramused} | ${ramp}`);

		if ((this.props.loggedIn === 2) && cpup && netp && ramp) {
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
}

class ScatterAccountInfo extends React.PureComponent {
	render() {
		let sellableBytes = this.props.accRamQuota - this.props.accRamUsed;
		let parsedAccBal;
		if (this.props.accBal) {
			parsedAccBal = this.props.accBal.substr(0,this.props.accBal.indexOf(' '));
		} else {
			parsedAccBal = 0;
		}

		if (this.props.loggedIn === 2) {
			return (
				<div>
					<ul className="list-group list-group-flush" id="scatter-account-summary">
						<li className="list-group-item list-group-item-accname" id="info-scatter-identityname">Account: <b>{this.props.scatter.identity.accounts[0].name}</b></li>
						<li className="list-group-item list-group-item-accname" id="info-scatter-eosbalance">WAX Balance: <b>{parsedAccBal}</b></li>
						<li className="list-group-item list-group-item-accname" id="info-scatter-rambytes">Sellable Bytes: <b>{sellableBytes.toLocaleString(navigator.language, { minimumFractionDigits: 0})} Bytes</b></li>
					</ul>
				</div>
			);
		} else {
			return null;
		}
	}
}


class AccountInfoBox extends React.PureComponent {

	render() {

		return (
			<div className="col-xl-4">
				<div className="card m-b-30" id={this.props.id}>
					<div className="card-header">
						<div id="scatter-connstatus">
							<img src="assets/images/scatter.png" id="scatterlogo" alt=""/>
							<ScatterStatus loggedIn={this.props.loggedIn}
							/>
						</div>
						<div id="scatterauth">
							<ScatterLoginButton
								loginHandler={this.props.loginHandler}
								loggedIn={this.props.loggedIn}
								scatterLoading={this.props.scatterLoading}
								scatter={this.props.scatter}
							/>
						</div>
					</div>
					<div className="card-body">
						<ul className="list-group list-group-flush">
							<li className="list-group-item list-group-item-acctinfo">
								<div className="row">
									<div className="col">
										<AccResourceUtilizations
											loggedIn={this.props.loggedIn}
											accRamQuota={this.props.accRamQuota}
											accRamUsed={this.props.accRamUsed}
											accStats_cpu_limit_max={this.props.accStats_cpu_limit_max}
											accStats_cpu_limit_used={this.props.accStats_cpu_limit_used}
											accStats_net_limit_used={this.props.accStats_net_limit_used}
											accStats_net_limit_max={this.props.accStats_net_limit_max}
										/>
									</div>
									<div className="col">
										<ScatterAccountInfo scatter={this.props.scatter}
											loggedIn={this.props.loggedIn}
											accBal={this.props.accBal}
											accRamQuota={this.props.accRamQuota}
											accRamUsed={this.props.accRamUsed}
										/>
									</div>
								</div>
							</li>
						</ul>
					</div>
				</div>
			</div>
		);
	}
}

export default AccountInfoBox;
