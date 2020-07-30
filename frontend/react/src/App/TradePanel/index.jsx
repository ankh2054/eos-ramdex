/*******************************
* Copyright 2018 Andrew Coutts
********************************/
import React, { useState } from 'react';
import './index.css';
import OrderEntryBox from './OrderEntryBox';
import AccountInfoBox from './AccountInfoBox';

const TradePanel = (props) => {

  /***********************************
  * Props passed down from parent:
  * props.currentRamPriceBytes
  ***********************************/


 const [ buyEosTextBoxValue, setBuyEosTextBoxValue ] = useState(null);
 const [ buyRamAmountTextBoxValue, setBuyRamAmountTextBoxValue ] = useState(null);
 const [ buyRamUnitsMultiplier, setBuyRamUnitsMultiplier ] = useState(1);
 const [ buyBytesPrecisionPlaceholder, setBuyBytesPrecisionPlaceholder ] = useState('0'); //~ change to 0.0000 when anything but 'bytes' is selected
 const [ buyLastSelectedBox, setBuyLastSelectedBox ] = useState(null);  //~ Keep track of which box we edited last: eos or ram, and use this to have the ram units onchange update the appropriate box value
 const [ buyRamUnitsTextBoxStep, setBuyRamUnitsTextBoxStep ] = useState(1);  //~ Bytes is shown by default so our step should be in whole numbers
 const [ buyRamUnitsTextMin, setBuyRamUnitsTextMin ] = useState(1);
 const [ sellEosTextBoxValue, setSellEosTextBoxValue ] = useState(null);
 const [ sellRamAmountTextBoxValue, setSellRamAmountTextBoxValue ] = useState(null);
 const [ sellRamUnitsMultiplier, setSellRamUnitsMultiplier ] = useState(1);
 const [ sellRamParsedUnits, setSellRamParsedUnits] = useState(0);
 const [ buyRamParsedUnits, setBuyRamParsedUnits ] = useState(0);
 const [ sellBytesPrecisionPlaceholder, setSellBytesPrecisionPlaceholder ] = useState('0'); //~ change to 0.0000 when anything but 'bytes' is selected
 const [ sellLastSelectedBox, setSellLastSelectedBox ] = useState(null);  //~ Keep track of which box we edited last= eos or ram, and use this to have the ram units onchange update the appropriate box value
 const [ sellRamUnitsTextBoxStep, setSellRamUnitsTextBoxStep ] = useState(1);  //~ Bytes is shown by default so our step should be in whole numbers
 const [ sellRamUnitsTextMin, setSellRamUnitsTextMin ] = useState(1);
 const [ lastTxId, setLastTxId ] = useState(null);
 const [ lastTxResp, setLastTxResp ] = useState(null);
 const [ buyMaxBoxChecked, setBuyMaxBoxChecked ] = useState(false);
 const [ sellMaxBoxChecked, setSellMaxBoxChecked ] = useState(false);



  const handleBuyMaxCheckboxChange = (e) => {
    if (!props.accBal) {
      return;
    } else {
      let tmp = {
        target: {
          value: props.accBal.substr(0, props.accBal.indexOf(' '))
        }
      }
      eosTextChangedHandlerBuy(tmp);
      setBuyEosTextBoxValue(tmp.target.value);

    }
  };

  const handleSellMaxCheckboxChange = (e) => {
    let tmp = {
      target: {
        value: ((props.accRamQuota - props.accRamUsed) - 100) / sellRamUnitsMultiplier
        /*value: props.accRamQuota - props.accRamUsed*/
      }
    }
    ramTextChangedHandlerSell(tmp);

    setSellLastSelectedBox('eos');
    setSellRamAmountTextBoxValue((((props.accRamQuota - props.accRamUsed) - 100) / sellRamUnitsMultiplier).toFixed(sellRamParsedUnits));

  }

  //~ Ensure we limit input on the EOS boxes to only 4 decimal places
  const sanitizeInput = (num, type, context) => {
    let checkVal;
    if (context === 'buy') {
      //~ being called from buy handler
      checkVal = buyRamUnitsMultiplier;
    } else {
      //~ being called from sell handler
      checkVal = sellRamUnitsMultiplier;
    }
    //~ console.log('Sanitizing input: ' + num);
    if (num === '0') {
      //~ console.log(`Detected 0 input, don't do anything`);
      return num;
    }

    let originalNum = num;
    num = String(num);
    //~ console.log(`Processing sanitized input | indexOf('.'): ${num.indexOf('.')}`);
    if (num.indexOf('.') !== -1) {
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
        let ret = numarr[0] + "." + numarr[1].charAt(0) + numarr[1].charAt(1) + numarr[1].charAt(2) + numarr[1].charAt(3);
        //~ console.log(`Returning: ${ret}`);
        return ret;
      }
    }
    else {
      //~ console.log(`Returning original num: ${originalNum}`);
      return originalNum;
    }
  }

  const eosTextChangedHandlerBuy = (e) => {
    const eParsed = sanitizeInput(e.target.value, 'wax', 'buy');
    let parsedUnits;

    switch (buyRamUnitsMultiplier) {
      case 1:
        parsedUnits = 0;
        break;

      case 1024:
        parsedUnits = 4;
        break;

      case 1024 * 1024:
        parsedUnits = 4;
        break;

      case 1024 * 1024 * 1024:
        parsedUnits = 4;
        break;

      default:
        break;
    }


    setBuyEosTextBoxValue(eParsed);
    setBuyRamAmountTextBoxValue((eParsed / (props.currentRamPriceBytes * buyRamUnitsMultiplier)).toFixed(parsedUnits));
    setBuyLastSelectedBox('eos');

  }

  const eosTextChangedHandlerSell = (e) => {
    const eParsed = sanitizeInput(e.target.value, 'wax', 'sell');
    let parsedUnits;

    switch (sellRamUnitsMultiplier) {
      case 1:
        parsedUnits = 0;
        break;

      case 1024:
        parsedUnits = 4;
        break;

      case 1024 * 1024:
        parsedUnits = 4;
        break;

      case 1024 * 1024 * 1024:
        parsedUnits = 4;
        break;

      default:
        break;
    }


    setSellEosTextBoxValue(eParsed);
    setSellRamAmountTextBoxValue((eParsed / (props.currentRamPriceBytes * sellRamUnitsMultiplier)).toFixed(parsedUnits));
    setSellLastSelectedBox('eos');

  }


  const ramTextChangedHandlerBuy = (e) => {
    //~ console.log(`Detected input change on Ram Text Field: ${e}`);
    const eParsed = sanitizeInput(e.target.value, 'ram', 'buy');

    setBuyRamAmountTextBoxValue(eParsed);
    setBuyEosTextBoxValue((eParsed * props.currentRamPriceBytes * buyRamUnitsMultiplier).toFixed(8));
    setBuyLastSelectedBox('ram');

  }

  const ramTextChangedHandlerSell = (e) => {
    //~ console.log(`Detected input change on Ram Text Field: ${e}`);
    const eParsed = sanitizeInput(e.target.value, 'ram', 'sell');

    setSellRamAmountTextBoxValue(eParsed);
    setSellEosTextBoxValue((eParsed * props.currentRamPriceBytes * sellRamUnitsMultiplier).toFixed(8));
    setSellLastSelectedBox('ram');

  }

  const buyHandleRamUnitsChanged = (e) => {
    let parsedBuyRamAmountTextBoxValue = parseFloat(buyRamAmountTextBoxValue || 0);
    let parsedBuyEosTextBoxValue = parseFloat(buyEosTextBoxValue || 0);
    let newBuyRamUnitsMultiplier;
    let newBuyBytesPrecisionPlaceholder;
    let newBuyRamUnitsTextBoxStep;
    let newBuyRamUnitsTextMin;
    let parsedUnits;

    switch (e.target.value) {
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
        newBuyRamUnitsMultiplier = 1024 * 1024;
        newBuyBytesPrecisionPlaceholder = '0.0000';
        newBuyRamUnitsTextBoxStep = 0.0001;
        newBuyRamUnitsTextMin = 0.0001;
        parsedUnits = 4;
        break;

      case 'RAM (GiB)':
        newBuyRamUnitsMultiplier = 1024 * 1024 * 1024;
        newBuyBytesPrecisionPlaceholder = '0.0000';
        newBuyRamUnitsTextBoxStep = 0.0001;
        newBuyRamUnitsTextMin = 0.0001;
        parsedUnits = 4;
        break;

      default:
        break;
    }

    setBuyRamUnitsMultiplier(newBuyRamUnitsMultiplier);
    setBuyBytesPrecisionPlaceholder(newBuyBytesPrecisionPlaceholder);
    setBuyRamUnitsTextBoxStep(newBuyRamUnitsTextBoxStep);
    setBuyRamUnitsTextMin(newBuyRamUnitsTextMin);
    setBuyRamParsedUnits(parsedUnits);


    if (buyLastSelectedBox === 'eos') {
      //~ The last box we changed was the EOS box, so if we change RAM units we want to see the change reflected in the RAM box

      setBuyRamAmountTextBoxValue((parsedBuyEosTextBoxValue / (props.currentRamPriceBytes * newBuyRamUnitsMultiplier)).toFixed(parsedUnits));


    } else {
      //~ The last box we changed was the RAM box, so if we change RAM units we want to see the change reflected in the EOS box
      console.log(`parsedBuyRamAmountTextBoxValue: ${parsedBuyRamAmountTextBoxValue} | props.currentRamPriceBytes: ${props.currentRamPriceBytes} | newBuyRamUnitsMultiplier:${newBuyRamUnitsMultiplier}`)


      setBuyRamAmountTextBoxValue(parsedBuyRamAmountTextBoxValue.toFixed(parsedUnits));
      setBuyEosTextBoxValue((parsedBuyRamAmountTextBoxValue * props.currentRamPriceBytes * newBuyRamUnitsMultiplier).toFixed(8));

    }
  }

  const sellHandleRamUnitsChanged = (e) => {
    let parsedSellRamAmountTextBoxValue = parseFloat(sellRamAmountTextBoxValue || 0);
    let parsedSellEosTextBoxValue = parseFloat(sellEosTextBoxValue || 0);
    let newSellRamUnitsMultiplier;
    let newSellBytesPrecisionPlaceholder;
    let newSellRamUnitsTextBoxStep;
    let newSellRamUnitsTextMin;
    let parsedUnits;

    switch (e.target.value) {
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
        newSellRamUnitsMultiplier = 1024 * 1024;
        newSellBytesPrecisionPlaceholder = '0.0000';
        newSellRamUnitsTextBoxStep = 0.0001;
        newSellRamUnitsTextMin = 0.0001;
        parsedUnits = 4;
        break;

      case 'RAM (GiB)':
        newSellRamUnitsMultiplier = 1024 * 1024 * 1024;
        newSellBytesPrecisionPlaceholder = '0.0000';
        newSellRamUnitsTextBoxStep = 0.0001;
        newSellRamUnitsTextMin = 0.0001;
        parsedUnits = 4;
        break;

      default:
        break;
    }


    setSellRamUnitsMultiplier(newSellRamUnitsMultiplier);
    setSellBytesPrecisionPlaceholder(newSellBytesPrecisionPlaceholder);
    setSellRamUnitsTextBoxStep(newSellRamUnitsTextBoxStep);
    setSellRamUnitsTextMin(newSellRamUnitsTextMin);
    setSellRamParsedUnits(parsedUnits);


    if (sellLastSelectedBox === 'eos') {
      //~ The last box we changed was the EOS box, so if we change RAM units we want to see the change reflected in the RAM box

      setSellRamAmountTextBoxValue((parsedSellEosTextBoxValue / (props.currentRamPriceBytes * newSellRamUnitsMultiplier)).toFixed(parsedUnits));


    } else {
      //~ The last box we changed was the RAM box, so if we change RAM units we want to see the change reflected in the EOS box

      setSellRamAmountTextBoxValue(parsedSellRamAmountTextBoxValue.toFixed(parsedUnits));
      setSellEosTextBoxValue((parsedSellRamAmountTextBoxValue * props.currentRamPriceBytes * newSellRamUnitsMultiplier).toFixed(8));

    }
  }


  const buyRamHandler = async (e) => {
    e.preventDefault();

    // console.log(props.scatterEosObj)
    try {
      const result = await props.scatterEosObj.transact(
        {
          actions: [
            {
              account: "eosio",
              name: "buyram",
              authorization: [
                {
                  actor: props.scatter.account("eos").name,
                  permission: props.scatter.account("eos").authority,
                },
              ],
              data: {
                payer: props.scatter.account("eos").name,
                receiver: props.scatter.account("eos").name,
                quant: `${parseFloat(buyEosTextBoxValue || "0.0000").toFixed(8)} WAX`,
              },
            },
          ]
        },
        {
          blocksBehind: 3,
          expireSeconds: 30,
        },
      )
      props.notifyTx("success", "Transaction Successful", result.processed.id)
      props.updateAccBal();
    } catch (e) {
      console.log(e.message)
      props.notifyTx("error", e.message.slice(0, 1).toUpperCase().concat(e.message.slice(1, e.message.length)), null)
    }
  }

  const sellRamHandler = async (e) => {
    e.preventDefault();

    try {
      const result = await props.scatterEosObj.transact(
        {
          actions: [
            {
              account: "eosio",
              name: "sellram",
              authorization: [
                {
                  actor: props.scatter.account("eos").name,
                  permission: props.scatter.account("eos").authority,
                },
              ],
              data: {
                account: props.scatter.account("eos").name,
                bytes: parseFloat(sellRamAmountTextBoxValue * sellRamUnitsMultiplier).toFixed(0),
              },
            },
          ]
        },
        {
          blocksBehind: 3,
          expireSeconds: 30,
        },
      )
      props.notifyTx("success", "Transaction Successful", result.processed.id)
      props.updateAccBal();
    } catch (e) {
      console.log(e)
      props.notifyTx("error", e.message.slice(0, 1).toUpperCase().concat(e.message.slice(1, e.message.length)), null)
    }
  }


  return (
    <div className="row" id={props.id}>
      <OrderEntryBox
        id="scatter-buyram-box"
        eosTextBoxValue={buyEosTextBoxValue}
        eosTextChangedHandler={eosTextChangedHandlerBuy}
        ramAmountTextBoxValue={buyRamAmountTextBoxValue}
        ramTextChangedHandler={ramTextChangedHandlerBuy}
        buttonHandler={buyRamHandler}
        boxTitle="Buy RAM"
        buttonType="BUY"
        loggedInState={props.loggedInState}
        ramUnitsChangedHandler={buyHandleRamUnitsChanged}
        bytesPrecisionPlaceholder={buyBytesPrecisionPlaceholder}
        ramUnitsTextBoxStep={buyRamUnitsTextBoxStep}
        ramUnitsTextMin={buyRamUnitsTextMin}
        checkBoxHandler={handleBuyMaxCheckboxChange}
        boxCheckedVar={buyMaxBoxChecked}
        statusBalance={props.accBal}
      />

      <AccountInfoBox
        id="scatter-info-box"
        loginHandler={props.loginHandler}
        loggedIn={props.loggedInState}
        scatter={props.scatter}
        accBal={props.accBal}
        accRamQuota={props.accRamQuota}
        accRamUsed={props.accRamUsed}
        accStats_cpu_limit_max={props.accStats_cpu_limit_max}
        accStats_cpu_limit_used={props.accStats_cpu_limit_used}
        accStats_net_limit_used={props.accStats_net_limit_used}
        accStats_net_limit_max={props.accStats_net_limit_max}
        scatterLoading={props.scatterLoading}
      />

      <OrderEntryBox
        id="scatter-sellram-box"
        eosTextBoxValue={sellEosTextBoxValue}
        eosTextChangedHandler={eosTextChangedHandlerSell}
        ramAmountTextBoxValue={sellRamAmountTextBoxValue}
        ramTextChangedHandler={ramTextChangedHandlerSell}
        buttonHandler={sellRamHandler}
        boxTitle="Sell RAM"
        buttonType="SELL"
        loggedInState={props.loggedInState}
        ramUnitsChangedHandler={sellHandleRamUnitsChanged}
        bytesPrecisionPlaceholder={sellBytesPrecisionPlaceholder}
        ramUnitsTextBoxStep={sellRamUnitsTextBoxStep}
        ramUnitsTextMin={sellRamUnitsTextMin}
        checkBoxHandler={handleSellMaxCheckboxChange}
        boxCheckedVar={sellMaxBoxChecked}
        statusBalance={props.accRamQuota - props.accRamUsed}
      />
    </div>
  );

}

export default TradePanel;
