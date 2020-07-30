/*******************************
* Copyright 2018 Andrew Coutts
********************************/
import * as React from 'react';
import './index.css';
import OrderEntryBox from './OrderEntryBox';
import AccountInfoBox from './AccountInfoBox';

class TradePanel extends React.PureComponent {

  /***********************************
  * Props passed down from parent:
  * this.props.currentRamPriceBytes
  ***********************************/

  constructor(props) {
    super(props);
    this.state = {
      buyEosTextBoxValue: null,
      buyRamAmountTextBoxValue: null,
      buyRamUnitsMultiplier: 1,
      buyBytesPrecisionPlaceholder: '0', //~ change to 0.0000 when anything but 'bytes' is selected
      buyLastSelectedBox: null,  //~ Keep track of which box we edited last: eos or ram, and use this to have the ram units onchange update the appropriate box value
      buyRamUnitsTextBoxStep: 1,  //~ Bytes is shown by default so our step should be in whole numbers
      buyRamUnitsTextMin: 1,
      sellEosTextBoxValue: null,
      sellRamAmountTextBoxValue: null,
      sellRamUnitsMultiplier: 1,
      sellBytesPrecisionPlaceholder: '0', //~ change to 0.0000 when anything but 'bytes' is selected
      sellLastSelectedBox: null,  //~ Keep track of which box we edited last: eos or ram, and use this to have the ram units onchange update the appropriate box value
      sellRamUnitsTextBoxStep: 1,  //~ Bytes is shown by default so our step should be in whole numbers
      sellRamUnitsTextMin: 1,
      lastTxId: null,
      lastTxResp: null,
      buyMaxBoxChecked: false,
      sellMaxBoxChecked: false
    };

    this.eosTextChangedHandlerBuy = this.eosTextChangedHandlerBuy.bind(this);
    this.ramTextChangedHandlerBuy = this.ramTextChangedHandlerBuy.bind(this);
    this.buyHandleRamUnitsChanged = this.buyHandleRamUnitsChanged.bind(this);
    this.eosTextChangedHandlerSell = this.eosTextChangedHandlerSell.bind(this);
    this.ramTextChangedHandlerSell = this.ramTextChangedHandlerSell.bind(this);
    this.sellHandleRamUnitsChanged = this.sellHandleRamUnitsChanged.bind(this);
    this.handleBuyMaxCheckboxChange = this.handleBuyMaxCheckboxChange.bind(this);
    this.handleSellMaxCheckboxChange = this.handleSellMaxCheckboxChange.bind(this);
  }

  handleBuyMaxCheckboxChange(e) {
    if (!this.props.accBal) {
      return;
    } else {
      let tmp = {
        target: {
          value: this.props.accBal.substr(0, this.props.accBal.indexOf(' '))
        }
      }
      this.eosTextChangedHandlerBuy(tmp);
      this.setState({
        buyMaxBoxChecked: !this.state.buyMaxBoxChecked,
        buyEosTextBoxValue: tmp.target.value
      })
    }
  }

  handleSellMaxCheckboxChange(e) {
    let tmp = {
      target: {
        value: ((this.props.accRamQuota - this.props.accRamUsed)-100) / this.state.sellRamUnitsMultiplier
        /*value: this.props.accRamQuota - this.props.accRamUsed*/
      }
    }
    this.ramTextChangedHandlerSell(tmp);
    this.setState({
      sellLastSelectedBox: 'eos',
      sellMaxBoxChecked: !this.state.sellMaxBoxChecked,
      sellRamAmountTextBoxValue: (((this.props.accRamQuota - this.props.accRamUsed)-100) / this.state.sellRamUnitsMultiplier).toFixed(this.state.sellRamParsedUnits)
      /*sellRamAmountTextBoxValue: this.props.accRamQuota - this.props.accRamUsed*/
    })
  }

  //~ Ensure we limit input on the EOS boxes to only 4 decimal places
  sanitizeInput = (num, type, context) => {
    let checkVal;
    if (context === 'buy') {
      //~ being called from buy handler
      checkVal = this.state.buyRamUnitsMultiplier;
    } else {
      //~ being called from sell handler
      checkVal = this.state.sellRamUnitsMultiplier;
    }
    //~ console.log('Sanitizing input: ' + num);
    if (num === '0') {
      //~ console.log(`Detected 0 input, don't do anything`);
      return num;
    }

    let originalNum = num;
    num = String(num);
    //~ console.log(`Processing sanitized input | indexOf('.'): ${num.indexOf('.')}`);
    if(num.indexOf('.') !== -1) {
      var numarr = num.split(".");
      //~ console.log(`Inside processing sanitized input | numsplit(".") === ${numarr} | numarr.length: ${numarr.length}`);
      if (numarr.length === 1) {
        return Number(num);
      }
      else {
        if ((checkVal === 1) && (type === 'ram')) { //~ If we are set to Bytes, only allow whole numbers in the RAM bytes field
          //~ console.log(`I think we are set to bytes and editing the ram field, so i'm returning just the first part of the array`);
          return numarr[0];
        }

        //~ console.log(`Inside numarr split processing | numarr[0]: ${numarr[0]} | numarr[1]: ${numarr[1]}`);
        //~ console.log(numarr);
        if (!numarr) {
          numarr = '0'
        }
        let ret = numarr[0]+"."+numarr[1].charAt(0)+numarr[1].charAt(1)+numarr[1].charAt(2)+numarr[1].charAt(3);
        //~ console.log(`Returning: ${ret}`);
        return ret;
      }
    }
    else {
      //~ console.log(`Returning original num: ${originalNum}`);
      return originalNum;
    }
  }

  eosTextChangedHandlerBuy(e) {
    const eParsed = this.sanitizeInput(e.target.value, 'wax', 'buy');
    let parsedUnits;

    switch(this.state.buyRamUnitsMultiplier) {
      case 1:
      parsedUnits = 0;
      break;

      case 1024:
      parsedUnits = 4;
      break;

      case 1024*1024:
      parsedUnits = 4;
      break;

      case 1024*1024*1024:
      parsedUnits = 4;
      break;

      default:
      break;
    }

    this.setState({
      buyEosTextBoxValue: eParsed,
      buyRamAmountTextBoxValue: (eParsed / (this.props.currentRamPriceBytes * this.state.buyRamUnitsMultiplier)).toFixed(parsedUnits),
      buyLastSelectedBox: 'eos'
    });
  }

  eosTextChangedHandlerSell(e) {
    const eParsed = this.sanitizeInput(e.target.value, 'wax', 'sell');
    let parsedUnits;

    switch(this.state.sellRamUnitsMultiplier) {
      case 1:
      parsedUnits = 0;
      break;

      case 1024:
      parsedUnits = 4;
      break;

      case 1024*1024:
      parsedUnits = 4;
      break;

      case 1024*1024*1024:
      parsedUnits = 4;
      break;

      default:
      break;
    }

    this.setState({
      sellEosTextBoxValue: eParsed,
      sellRamAmountTextBoxValue: (eParsed / (this.props.currentRamPriceBytes * this.state.sellRamUnitsMultiplier)).toFixed(parsedUnits),
      sellLastSelectedBox: 'eos'
    });
  }


  ramTextChangedHandlerBuy(e) {
    //~ console.log(`Detected input change on Ram Text Field: ${e}`);
    const eParsed = this.sanitizeInput(e.target.value, 'ram', 'buy');
    this.setState({
      buyRamAmountTextBoxValue: eParsed,
      buyEosTextBoxValue: (eParsed * this.props.currentRamPriceBytes * this.state.buyRamUnitsMultiplier).toFixed(8),
      buyLastSelectedBox: 'ram'
    });
  }

  ramTextChangedHandlerSell(e) {
    //~ console.log(`Detected input change on Ram Text Field: ${e}`);
    const eParsed = this.sanitizeInput(e.target.value, 'ram', 'sell');
    this.setState({
      sellRamAmountTextBoxValue: eParsed,
      sellEosTextBoxValue: (eParsed * this.props.currentRamPriceBytes * this.state.sellRamUnitsMultiplier).toFixed(8),
      sellLastSelectedBox: 'ram'
    });
  }

  buyHandleRamUnitsChanged(e) {
    let parsedBuyRamAmountTextBoxValue = parseFloat(this.state.buyRamAmountTextBoxValue || 0);
    let parsedBuyEosTextBoxValue = parseFloat(this.state.buyEosTextBoxValue || 0);
    let newBuyRamUnitsMultiplier;
    let newBuyBytesPrecisionPlaceholder;
    let newBuyRamUnitsTextBoxStep;
    let newBuyRamUnitsTextMin;
    let parsedUnits;

    switch(e.target.value) {
      case 'RAM (Bytes)':
      newBuyRamUnitsMultiplier = 1;
      newBuyBytesPrecisionPlaceholder = '0';
      newBuyRamUnitsTextBoxStep = 1;
      newBuyRamUnitsTextMin = 1;
      parsedUnits = 0;
      break;

      case 'RAM (KiB)':
      newBuyRamUnitsMultiplier = 1024;
      newBuyBytesPrecisionPlaceholder = '0.0000';
      newBuyRamUnitsTextBoxStep = 0.0001;
      newBuyRamUnitsTextMin = 0.0001;
      parsedUnits = 4;
      break;

      case 'RAM (MiB)':
      newBuyRamUnitsMultiplier = 1024*1024;
      newBuyBytesPrecisionPlaceholder = '0.0000';
      newBuyRamUnitsTextBoxStep = 0.0001;
      newBuyRamUnitsTextMin = 0.0001;
      parsedUnits = 4;
      break;

      case 'RAM (GiB)':
      newBuyRamUnitsMultiplier = 1024*1024*1024;
      newBuyBytesPrecisionPlaceholder = '0.0000';
      newBuyRamUnitsTextBoxStep = 0.0001;
      newBuyRamUnitsTextMin = 0.0001;
      parsedUnits = 4;
      break;

      default:
      break;
    }

    this.setState({
      buyRamUnitsMultiplier: newBuyRamUnitsMultiplier,
      buyBytesPrecisionPlaceholder: newBuyBytesPrecisionPlaceholder,
      buyRamUnitsTextBoxStep: newBuyRamUnitsTextBoxStep,
      buyRamUnitsTextMin: newBuyRamUnitsTextMin,
      buyRamParsedUnits: parsedUnits
    });

    if (this.state.buyLastSelectedBox === 'eos') {
      //~ The last box we changed was the EOS box, so if we change RAM units we want to see the change reflected in the RAM box
      this.setState({
        buyRamAmountTextBoxValue: (parsedBuyEosTextBoxValue / (this.props.currentRamPriceBytes * newBuyRamUnitsMultiplier)).toFixed(parsedUnits)
      });

    } else {
      //~ The last box we changed was the RAM box, so if we change RAM units we want to see the change reflected in the EOS box
      console.log(`parsedBuyRamAmountTextBoxValue: ${parsedBuyRamAmountTextBoxValue} | this.props.currentRamPriceBytes: ${this.props.currentRamPriceBytes} | newBuyRamUnitsMultiplier:${newBuyRamUnitsMultiplier}`)
      this.setState({
        buyRamAmountTextBoxValue: parsedBuyRamAmountTextBoxValue.toFixed(parsedUnits),
        buyEosTextBoxValue: (parsedBuyRamAmountTextBoxValue * this.props.currentRamPriceBytes * newBuyRamUnitsMultiplier).toFixed(8)
      });
    }
  }

  sellHandleRamUnitsChanged(e) {
    let parsedSellRamAmountTextBoxValue = parseFloat(this.state.sellRamAmountTextBoxValue || 0);
    let parsedSellEosTextBoxValue = parseFloat(this.state.sellEosTextBoxValue || 0);
    let newSellRamUnitsMultiplier;
    let newSellBytesPrecisionPlaceholder;
    let newSellRamUnitsTextBoxStep;
    let newSellRamUnitsTextMin;
    let parsedUnits;

    switch(e.target.value) {
      case 'RAM (Bytes)':
      newSellRamUnitsMultiplier = 1;
      newSellBytesPrecisionPlaceholder = '0';
      newSellRamUnitsTextBoxStep = 1;
      newSellRamUnitsTextMin = 1;
      parsedUnits = 0;
      break;

      case 'RAM (KiB)':
      newSellRamUnitsMultiplier = 1024;
      newSellBytesPrecisionPlaceholder = '0.0000';
      newSellRamUnitsTextBoxStep = 0.0001;
      newSellRamUnitsTextMin = 0.0001;
      parsedUnits = 4;
      break;

      case 'RAM (MiB)':
      newSellRamUnitsMultiplier = 1024*1024;
      newSellBytesPrecisionPlaceholder = '0.0000';
      newSellRamUnitsTextBoxStep = 0.0001;
      newSellRamUnitsTextMin = 0.0001;
      parsedUnits = 4;
      break;

      case 'RAM (GiB)':
      newSellRamUnitsMultiplier = 1024*1024*1024;
      newSellBytesPrecisionPlaceholder = '0.0000';
      newSellRamUnitsTextBoxStep = 0.0001;
      newSellRamUnitsTextMin = 0.0001;
      parsedUnits = 4;
      break;

      default:
      break;
    }

    this.setState({
      sellRamUnitsMultiplier: newSellRamUnitsMultiplier,
      sellBytesPrecisionPlaceholder: newSellBytesPrecisionPlaceholder,
      sellRamUnitsTextBoxStep: newSellRamUnitsTextBoxStep,
      sellRamUnitsTextMin: newSellRamUnitsTextMin,
      sellRamParsedUnits: parsedUnits
    });

    if (this.state.sellLastSelectedBox === 'eos') {
      //~ The last box we changed was the EOS box, so if we change RAM units we want to see the change reflected in the RAM box
      this.setState({
        sellRamAmountTextBoxValue: (parsedSellEosTextBoxValue / (this.props.currentRamPriceBytes * newSellRamUnitsMultiplier)).toFixed(parsedUnits)
      });

    } else {
      //~ The last box we changed was the RAM box, so if we change RAM units we want to see the change reflected in the EOS box
      this.setState({
        sellRamAmountTextBoxValue: parsedSellRamAmountTextBoxValue.toFixed(parsedUnits),
        sellEosTextBoxValue: (parsedSellRamAmountTextBoxValue * this.props.currentRamPriceBytes * newSellRamUnitsMultiplier).toFixed(8)
      });
    }
  }


  buyRamHandler = async (e) => {
    e.preventDefault();

    // console.log(this.props.scatterEosObj)
    try {
      const result = await this.props.scatterEosObj.transact(
        {
          actions: [
            {
              account: "eosio",
              name: "buyram",
              authorization: [
                {
                  actor: this.props.scatter.account("eos").name,
                  permission: this.props.scatter.account("eos").authority,
                },
              ],
              data: {
                payer: this.props.scatter.account("eos").name,
                receiver: this.props.scatter.account("eos").name,
                quant: `${parseFloat(this.state.buyEosTextBoxValue || "0.0000").toFixed(8)} WAX`,
              },
            },
          ]
        },
        {
          blocksBehind: 3,
          expireSeconds: 30,
        },
      )
      this.props.notifyTx("success", "Transaction Successful", result.processed.id)
      this.props.updateAccBal();
    } catch(e) {
      console.log(e.message)
      this.props.notifyTx("error",  e.message.slice(0, 1).toUpperCase().concat(e.message.slice(1, e.message.length)), null)
    }
  }

  sellRamHandler = async (e) => {
    e.preventDefault();

    try {
      const result = await this.props.scatterEosObj.transact(
        {
          actions: [
            {
              account: "eosio",
              name: "sellram",
              authorization: [
                {
                  actor: this.props.scatter.account("eos").name,
                  permission: this.props.scatter.account("eos").authority,
                },
              ],
              data: {
                account: this.props.scatter.account("eos").name,
                bytes: parseFloat(this.state.sellRamAmountTextBoxValue * this.state.sellRamUnitsMultiplier).toFixed(0),
              },
            },
          ]
        },
        {
          blocksBehind: 3,
          expireSeconds: 30,
        },
      )
      this.props.notifyTx("success", "Transaction Successful", result.processed.id)
      this.props.updateAccBal();
    } catch(e) {
      console.log(e)
      this.props.notifyTx("error",  e.message.slice(0, 1).toUpperCase().concat(e.message.slice(1, e.message.length)), null)
    }
  }

  render() {
    return (
      <div className="row" id={this.props.id}>
        <OrderEntryBox
          id="scatter-buyram-box"
          eosTextBoxValue={this.state.buyEosTextBoxValue}
          eosTextChangedHandler={this.eosTextChangedHandlerBuy}
          ramAmountTextBoxValue={this.state.buyRamAmountTextBoxValue}
          ramTextChangedHandler={this.ramTextChangedHandlerBuy}
          buttonHandler={this.buyRamHandler}
          boxTitle="Buy RAM"
          buttonType="BUY"
          loggedInState={this.props.loggedInState}
          ramUnitsChangedHandler={this.buyHandleRamUnitsChanged}
          bytesPrecisionPlaceholder={this.state.buyBytesPrecisionPlaceholder}
          ramUnitsTextBoxStep={this.state.buyRamUnitsTextBoxStep}
          ramUnitsTextMin={this.state.buyRamUnitsTextMin}
          checkBoxHandler={this.handleBuyMaxCheckboxChange}
          boxCheckedVar={this.state.buyMaxBoxChecked}
          statusBalance={this.props.accBal}
        />

        <AccountInfoBox
          id="scatter-info-box"
          loginHandler={this.props.loginHandler}
          loggedIn={this.props.loggedInState}
          scatter={this.props.scatter}
          accBal={this.props.accBal}
          accRamQuota={this.props.accRamQuota}
          accRamUsed={this.props.accRamUsed}
          accStats_cpu_limit_max={this.props.accStats_cpu_limit_max}
          accStats_cpu_limit_used={this.props.accStats_cpu_limit_used}
          accStats_net_limit_used={this.props.accStats_net_limit_used}
          accStats_net_limit_max={this.props.accStats_net_limit_max}
          scatterLoading={this.props.scatterLoading}
        />

        <OrderEntryBox
          id="scatter-sellram-box"
          eosTextBoxValue={this.state.sellEosTextBoxValue}
          eosTextChangedHandler={this.eosTextChangedHandlerSell}
          ramAmountTextBoxValue={this.state.sellRamAmountTextBoxValue}
          ramTextChangedHandler={this.ramTextChangedHandlerSell}
          buttonHandler={this.sellRamHandler}
          boxTitle="Sell RAM"
          buttonType="SELL"
          loggedInState={this.props.loggedInState}
          ramUnitsChangedHandler={this.sellHandleRamUnitsChanged}
          bytesPrecisionPlaceholder={this.state.sellBytesPrecisionPlaceholder}
          ramUnitsTextBoxStep={this.state.sellRamUnitsTextBoxStep}
          ramUnitsTextMin={this.state.sellRamUnitsTextMin}
          checkBoxHandler={this.handleSellMaxCheckboxChange}
          boxCheckedVar={this.state.sellMaxBoxChecked}
          statusBalance={this.props.accRamQuota - this.props.accRamUsed}
        />
      </div>
    );
  }
}

export default TradePanel;
