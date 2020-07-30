/*******************************
* Copyright 2018 Andrew Coutts
********************************/
import * as React from 'react';
import './index.css';
import ReactTooltip from 'react-tooltip'

import {
	Card,
	CardContent
  } from '@material-ui/core';

const OrderButton = (props) => {

	const { buttonType, buttonHandler, loggedInState } = props;

	if (buttonType === 'BUY') {
		if (loggedInState === 2) {
			return (
				<button type="button" className="btn btn-success w-md orderbtn" id="btn-buy" onClick={buttonHandler}>BUY</button>
			);
		} else {
			return (
				<button type="button" className="btn btn-secondary w-md orderbtn" id="btn-buy" disabled>Please Login to Trade</button>
			);
		}
	} else {
		if (loggedInState === 2) {
			return (
				<button type="button" className="btn btn-danger w-md orderbtn" id="btn-sell" onClick={buttonHandler}>SELL</button>
			);
		} else {
			return (
				<button type="button" className="btn btn-secondary w-md orderbtn" id="btn-sell" disabled>Please Login to Trade</button>
			);
		}
	}

}

const MyEosInputField = (props) => {

	const { boxCheckedVar, eosTextBoxValue, eosTextChangedHandler } = props;

	if (boxCheckedVar) {
		return (
			<input
				type="number"
				pattern="[0-9]"
				step="0.0001"
				min="0.0001"
				className="form-control"
				value={eosTextBoxValue || ''}
				onChange={eosTextChangedHandler}
				placeholder="0.00000000"
				disabled
			/>
		);
	}
	return (
		<input
			type="number"
			pattern="[0-9]"
			step="0.0001"
			min="0.0001"
			className="form-control"
			value={eosTextBoxValue || ''}
			onChange={eosTextChangedHandler}
			placeholder="0.00000000"
		/>
	);


}

const MyRamInputField = (props) => {

	const { boxCheckedVar, ramUnitsTextBoxStep, ramUnitsTextMin, ramAmountTextBoxValue, ramTextChangedHandler, bytesPrecisionPlaceholder } = props;
	if (boxCheckedVar) {
		return (
			<input
				type="number"
				pattern="[0-9]"
				step={ramUnitsTextBoxStep}
				min={ramUnitsTextMin}
				className="form-control"
				value={ramAmountTextBoxValue || ''}
				onChange={ramTextChangedHandler}
				placeholder={bytesPrecisionPlaceholder}
				disabled
			/>
		);
	}
	return (
		<input
			type="number"
			pattern="[0-9]"
			step={ramUnitsTextBoxStep}
			min={ramUnitsTextMin}
			className="form-control"
			value={ramAmountTextBoxValue || ''}
			onChange={ramTextChangedHandler}
			placeholder={bytesPrecisionPlaceholder}
		/>
	);


}

const YoloCheckbox = (props) => {


	let checkBoxId = 'checkBoxSell';
	var toolTip = `Automatically calculate max sellable RAM minus a 100 byte safety buffer`;

	const { boxCheckedVar, checkBoxHandler, type, loggedInState } = props;

	if (type === 'BUY') {
		checkBoxId = 'checkBoxBuy';
		toolTip = `Automatically calculate max RAM you can afford`;
	}


	if (loggedInState === 2) {
		return (
			<div className="checkbox checkbox-primary usemax-box" data-tip={toolTip}>
				<input id={checkBoxId} type="checkbox" checked={boxCheckedVar} onChange={checkBoxHandler} />
				<label htmlFor={checkBoxId}>
					Use Max
					</label>
				<ReactTooltip delayShow={700} />
			</div>
		);
	}
	return (
		<div className="checkbox checkbox-primary usemax-box" data-tip={toolTip}>
			<input id={checkBoxId} type="checkbox" checked="" disabled />
			<label htmlFor={checkBoxId}>
				Use Max
					</label>
			<ReactTooltip delayShow={700} />
		</div>
	);


}

const OrderBoxAccBalance = (props) => {

	const { type, statusBalance } = props;
	if (type === 'BUY') {
		return (
			<span>{statusBalance || '0 WAX'}</span>
		);
	} else {
		if (statusBalance >= 1024) {
			return (
				<span>{statusBalance.toLocaleString(navigator.language, { minimumFractionDigits: 0 })} Bytes</span>
			);
		} else {

		}
		return (
			<span>{statusBalance} Bytes</span>
		);
	}

}

const OrderEntryBox = (props) => {

	return (
		<div className="col-xl-4">
			<div id={props.id}>
				<Card className="m-b-30">
					<div className="card-header">
						<h5>{props.boxTitle}</h5>
					</div>
					<CardContent>
						<div className="orderentry-row">
							<div className="input-group">
								<div className="input-group-prepend">
									<span className="input-group-text">WAX</span>
								</div>
								<MyEosInputField
									eosTextBoxValue={props.eosTextBoxValue}
									eosTextChangedHandler={props.eosTextChangedHandler}
									boxCheckedVar={props.boxCheckedVar}
								/>
							</div>
						</div>
						<div className="orderentry-row">
							<div className="input-group">
								<div className="input-group-prepend">
									<select className="form-control" onChange={props.ramUnitsChangedHandler}>
										<option>RAM (Bytes)</option>
										<option>RAM (KiB)</option>
										<option>RAM (MiB)</option>
										<option>RAM (GiB)</option>
									</select>
								</div>
								<MyRamInputField
									ramUnitsTextBoxStep={props.ramUnitsTextBoxStep}
									ramUnitsTextMin={props.ramUnitsTextMin}
									ramAmountTextBoxValue={props.ramAmountTextBoxValue}
									ramTextChangedHandler={props.ramTextChangedHandler}
									bytesPrecisionPlaceholder={props.bytesPrecisionPlaceholder}
									boxCheckedVar={props.boxCheckedVar}
								/>
							</div>
						</div>
						<div className="row infoline">
							<div className="col-6">
								<i className="dripicons-wallet wallet-icon"></i>
								<OrderBoxAccBalance
									type={props.buttonType}
									statusBalance={props.statusBalance}
								/>
							</div>
							<div className="col-6">
								<YoloCheckbox
									type={props.buttonType}
									boxCheckedVar={props.boxCheckedVar}
									checkBoxHandler={props.checkBoxHandler}
									loggedInState={props.loggedInState}
								/>
							</div>
						</div>
						<div className="row">
							<div className="col-12">
								<OrderButton
									loggedInState={props.loggedInState}
									buttonType={props.buttonType}
									buttonHandler={props.buttonHandler}
								/>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);

}


export default OrderEntryBox;
