/*******************************
* Copyright 2018 Andrew Coutts
********************************/
import * as React from 'react';
import './index.css';
import ReactTooltip from 'react-tooltip'

class OrderButton extends React.PureComponent {
	render() {

		if (this.props.buttonType === 'BUY') {
			if (this.props.loggedInState === 2) {
				return (
					<button type="button" className="btn btn-success w-md orderbtn" id="btn-buy" onClick={this.props.buttonHandler}>BUY</button>
				);
			} else {
				return (
					<button type="button" className="btn btn-secondary w-md orderbtn" id="btn-buy" disabled>Please Login to Trade</button>
				);
			}
		} else {
			if (this.props.loggedInState === 2) {
				return (
					<button type="button" className="btn btn-danger w-md orderbtn" id="btn-sell" onClick={this.props.buttonHandler}>SELL</button>
				);
			} else {
				return (
					<button type="button" className="btn btn-secondary w-md orderbtn" id="btn-sell" disabled>Please Login to Trade</button>
				);
			}
		}
	}
}

class MyEosInputField extends React.PureComponent {
	render() {
		if (this.props.boxCheckedVar === true) {
			return (
				<input
					type="number"
					pattern="[0-9]"
					step="0.0001"
					min="0.0001"
					className="form-control"
					value={this.props.eosTextBoxValue || ''}
					onChange={this.props.eosTextChangedHandler}
					placeholder="0.00000000"
					disabled
				/>
			);
		} else {
			return (
				<input
					type="number"
					pattern="[0-9]"
					step="0.0001"
					min="0.0001"
					className="form-control"
					value={this.props.eosTextBoxValue || ''}
					onChange={this.props.eosTextChangedHandler}
					placeholder="0.00000000"
				/>
			);
		}
	}
}

class MyRamInputField extends React.PureComponent {
	render() {
		if (this.props.boxCheckedVar === true) {
			return (
				<input
					type="number"
					pattern="[0-9]"
					step={this.props.ramUnitsTextBoxStep}
					min={this.props.ramUnitsTextMin}
					className="form-control"
					value={this.props.ramAmountTextBoxValue || ''}
					onChange={this.props.ramTextChangedHandler}
					placeholder={this.props.bytesPrecisionPlaceholder}
					disabled
				/>
			);
		} else {
			return (
				<input
					type="number"
					pattern="[0-9]"
					step={this.props.ramUnitsTextBoxStep}
					min={this.props.ramUnitsTextMin}
					className="form-control"
					value={this.props.ramAmountTextBoxValue || ''}
					onChange={this.props.ramTextChangedHandler}
					placeholder={this.props.bytesPrecisionPlaceholder}
				/>
			);
		}
	}
}

class YoloCheckbox extends React.PureComponent {
	render() {

		let checkBoxId;
		var toolTip;

		if (this.props.type === 'BUY') {
			checkBoxId = 'checkBoxBuy';
			toolTip = `Automatically calculate max RAM you can afford`;
		} else {
			checkBoxId = 'checkBoxSell';
			toolTip = `Automatically calculate max sellable RAM minus a 100 byte safety buffer`;
		}


		if (this.props.loggedInState === 2) {
			return (
				<div className="checkbox checkbox-primary usemax-box" data-tip={toolTip}>
					<input id={checkBoxId} type="checkbox" checked={this.props.boxCheckedVar} onChange={this.props.checkBoxHandler}/>
					<label htmlFor={checkBoxId}>
						Use Max
					</label>
					<ReactTooltip delayShow={700}/>
				</div>
			);
		} else {
			return (
				<div className="checkbox checkbox-primary usemax-box" data-tip={toolTip}>
					<input id={checkBoxId} type="checkbox" checked="" disabled/>
					<label htmlFor={checkBoxId}>
						Use Max
					</label>
					<ReactTooltip delayShow={700}/>
				</div>
			);
		}
	}
}

class OrderBoxAccBalance extends React.PureComponent {
	render() {
		if (this.props.type === 'BUY') {
			return (
				<span>{this.props.statusBalance || '0 WAX'}</span>
			);
		} else {
			if (this.props.statusBalance >= 1024) {
				return (
					<span>{this.props.statusBalance.toLocaleString(navigator.language, { minimumFractionDigits: 0})} Bytes</span>
				);
			} else {

			}
			return (
				<span>{this.props.statusBalance} Bytes</span>
			);
		}
	}
}

class OrderEntryBox extends React.PureComponent {

	constructor(props) {
		super(props);
		this.state = {

		};
	}

	render() {
		return (
			<div className="col-xl-4">
				<div id={this.props.id}>
					<div className="card m-b-30">
						<div className="card-header">
							<h5>{this.props.boxTitle}</h5>
						</div>
						<div className="card-body">
							<div className="orderentry-row">
								<div className="input-group">
									<div className="input-group-prepend">
										<span className="input-group-text">WAX</span>
									</div>
									<MyEosInputField
										eosTextBoxValue={this.props.eosTextBoxValue}
										eosTextChangedHandler={this.props.eosTextChangedHandler}
										boxCheckedVar={this.props.boxCheckedVar}
									/>
								</div>
							</div>
							<div className="orderentry-row">
								<div className="input-group">
									<div className="input-group-prepend">
										<select className="form-control" onChange={this.props.ramUnitsChangedHandler}>
											<option>RAM (Bytes)</option>
											<option>RAM (KiB)</option>
											<option>RAM (MiB)</option>
											<option>RAM (GiB)</option>
										</select>
									</div>
									<MyRamInputField
										ramUnitsTextBoxStep={this.props.ramUnitsTextBoxStep}
										ramUnitsTextMin={this.props.ramUnitsTextMin}
										ramAmountTextBoxValue={this.props.ramAmountTextBoxValue}
										ramTextChangedHandler={this.props.ramTextChangedHandler}
										bytesPrecisionPlaceholder={this.props.bytesPrecisionPlaceholder}
										boxCheckedVar={this.props.boxCheckedVar}
									/>
								</div>
							</div>
							<div className="row infoline">
								<div className="col-6">
									<i className="dripicons-wallet wallet-icon"></i>
									<OrderBoxAccBalance
										type={this.props.buttonType}
										statusBalance={this.props.statusBalance}
									/>
								</div>
								<div className="col-6">
									<YoloCheckbox
										type={this.props.buttonType}
										boxCheckedVar={this.props.boxCheckedVar}
										checkBoxHandler={this.props.checkBoxHandler}
										loggedInState={this.props.loggedInState}
									/>
								</div>
							</div>
							<div className="row">
								<div className="col-12">
									<OrderButton
										loggedInState={this.props.loggedInState}
										buttonType={this.props.buttonType}
										buttonHandler={this.props.buttonHandler}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		);
	}
}


export default OrderEntryBox;
