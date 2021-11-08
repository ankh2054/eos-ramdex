const config = process.env;
const moment = require('moment');
const request = require('request');
const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
// const underscore = require('underscore');
require("dotenv").config()

if (
  !process.env.dbapi_url ||
  !process.env.server_port
) {
  console.error("Error: missing environment variable")
  process.exit(0)
}

var stillWorkingRam = false;
var stillWorkingVol = false;
var stillWorkingTradesList = false;
// var stillWorkingRawActions = false;
var lockCandle = false;

var lastRamAccBal;
var lastRamPrice;
var tickCount = 0;
var firstRunTick = true;

//~ Candle object we will store in the DB every 1s
var curCandle = {
  timestamp: moment.utc().format(),
  open: lastRamPrice,
  high: 0,
  low: 0,
  close: 0,
  volume: 0
}

//~ V2 - get actions directly from the node ourselves
var curRecentActionsList = [];

//~ Public EOS API nodes that we randomly select from for each data request. Must be able to respond in <230ms to be a viable API
// var nodeosEndpoints = 'https://chain.wax.io';
var nodeosEndpoints = 'https://hyperion.sentnl.io';

async function dataTickUpdateTask() {
  //~ Check to see if we already have an outstanding request to get Ram or Vol data. Only send the next request if we don't
  if ((!stillWorkingRam) && (!stillWorkingVol) && (!stillWorkingTradesList)) {
    let endpoint = nodeosEndpoints;
    console.log(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] ${++tickCount} ******* Update Tick | timestamp: ${curCandle.timestamp} | o: ${curCandle.open} | h: ${curCandle.high} | l: ${curCandle.low} | c: ${curCandle.close} | v: ${curCandle.volume} | Endpoint: ${endpoint}`);
    const promises = [getRamPriceData(endpoint), getVolData(endpoint), getRawRecentActions(endpoint)];

    Promise.all(promises).then((results) => {
      //console.log(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] **** Returned values from both requests: ramData: ${results[0]} | volData: ${results[1]}`);

      lastRamPrice = results[0];
      let curRamAccVal = results[1];
      let curUpdateVolume = Math.abs(curRamAccVal - lastRamAccBal);
      //~ console.log(`curRamAccVal: ${curRamAccVal} || lastRamAccBal: ${lastRamAccBal} || Diff: ${curUpdateVolume}`);
      if (!curUpdateVolume) {
        curUpdateVolume = 0;
      } else {
        //console.log(`VOLUME CHANGE: ${curUpdateVolume}`);
      }
      lastRamAccBal = curRamAccVal;

      //~ Update the current candle we are going to be storing in the DB
      if (!lockCandle) {
        if (lastRamPrice > curCandle.high) { curCandle.high = lastRamPrice; }
        if (lastRamPrice < curCandle.low) { curCandle.low = lastRamPrice; }
        curCandle.close = lastRamPrice;
        curCandle.volume += curUpdateVolume;
      }

      //~ Build a new candle object to send to trading view
      const newTickUpdate = {
        timestamp: moment.utc().format(),
        price: lastRamPrice,
        volume: curUpdateVolume
      }

      //~ console.log(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] Emitting price update to frontend`);
      io.emit('newPriceUpdate', newTickUpdate); //~ Send new tick update to frontend

      //~ Update frontend with recent trades list
      io.emit('newTradesListUpdate', curRecentActionsList);

    }).catch((e) => {
      //console.log(`Error getting data: ${e}`);
      console.log(e);

    });
  }
}


//~ Build a new candle object every 5s and store it to the DB
function buildCandleTask() {
  console.log(`-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------`);
  console.log(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] /////// Candle Tick | timestamp: ${curCandle.timestamp} | o: ${curCandle.open} | h: ${curCandle.high} | l: ${curCandle.low} | c: ${curCandle.close} | v: ${curCandle.volume}`)
  console.log(`-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------`);
  //~ TODO; Send the current curNewCandle object to the DB to be stored
  lockCandle = true;
  tickCount = 0;

  //~ Don't send any null values to the DB, wait for the next tick
  if (curCandle.timestamp && curCandle.open && curCandle.high && curCandle.low && curCandle.close) {
    storeToDb(curCandle.timestamp, curCandle.open, curCandle.high, curCandle.low, curCandle.close, curCandle.volume);
  } else if (!firstRunTick) { //~ Null candle values means we can't hit any nodes- pull the latest price from the DB and save it so we can keep the ticks going
    console.log(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] WARNING: candle values are null but we need to store a tick, grabbing last known values from the DB to store and prevent gaps in data`);
    request({
      url: `${config.dbapi_url}/v1/ram/latest`,
      method: "GET",
      json: true
    }, function (error, response, body) {
      if (error) {
        console.log(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] Error getting data from DB API: ${error}`);
      } else {
        console.log(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] Got last known candle values: o:${body[0].open} | h:${body[0].high} | l:${body[0].low} | c:${body[0].close}`);
        curCandle.open = body[0].open;
        curCandle.high = body[0].high;
        curCandle.low = body[0].low;
        curCandle.close = body[0].close;
        lastRamPrice = body[0].close; //~ Make sure next stale candle continues from same spot
        storeToDb(curCandle.timestamp, curCandle.open, curCandle.high, curCandle.low, curCandle.close, curCandle.volume);
      }
    })
  } else {
    console.log(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] First run tick- waiting to see if we can get valid data on next tick before storing stale data to continue the time-series`);
  }

  //~ Reset candle for next one
  curCandle.timestamp = moment.utc().format();
  curCandle.open = lastRamPrice;
  curCandle.high = lastRamPrice;
  curCandle.low = lastRamPrice;
  curCandle.close = lastRamPrice;
  curCandle.volume = 0;
  lockCandle = false;

  if (firstRunTick) { firstRunTick = false; }
}

async function getRawRecentActions() {
  return new Promise((resolve, reject) => {
    //~ console.log(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] Sending request for actions data`);
    stillWorkingRawActions = true;

    let data = '{"account_name":"eosio.ram", "pos":"-1", "offset":"-150"}';
    let json_obj = JSON.parse(data);

    request({
      url: `${nodeosEndpoints}/v1/history/get_actions`,
      method: "POST",
      json: json_obj,
      timeout: 450
    }, function (error, response, body) {
      if (error) {
        stillWorkingRawActions = false;
        //~ reject(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] Error in RAM actions: ${error}`);
        console.log(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] Error in RAM actions: ${error}`);
        resolve();
      } else if (!body.actions) {
        stillWorkingTradesList = false;
        //~ reject(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] Error: response did not contain ram actions data | Status Code: ${response.statusCode}`);
        console.log(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] Error: response did not contain ram actions data | Status Code: ${response.statusCode}`);
        resolve();
      } else {
        //~ console.log(`*`);
        //~ console.log(`*`);
        //~ console.log(`*`);
        //~ console.log(`================================ Ram Actions =========================================================`);

        curRecentActionsList = []; //~ zero out array for this run
        body.actions.map((e) => {
            let actionType = e.action_trace.act.data.from == 'eosio.ram' ? 'sell' : 'buy';
            //~ console.log(`${actionType} | ${e.action_trace.act.data.quantity.substr(0,e.action_trace.act.data.quantity.indexOf(' '))} | ${actionType == 'buy' ? e.action_trace.act.data.from : e.action_trace.act.data.to} | ${moment.utc(e.block_time).format('YYYY-MM-DD HH:mm:ss')}`)
            curRecentActionsList.push({
              timestamp: moment.utc(e.block_time).format('YYYY-MM-DD HH:mm:ss'),
              type: actionType,
              quantity: e.action_trace.act.data.quantity.substr(0, e.action_trace.act.data.quantity.indexOf(' ')),
              txid: e.action_trace.trx_id,
              user: actionType == 'buy' ? e.action_trace.act.data.from : e.action_trace.act.data.to
            })        
	});

        //~ Ensure it's sorted by timestamp
        curRecentActionsList.sort(function (a, b) {
          // Turn your strings into dates, and then subtract them
          // to get a value that is either negative, positive, or zero.
          return new moment.utc(b.timestamp) - new moment.utc(a.timestamp);
        });

        //~ curRecentActionsList = underscore.uniq(curRecentActionsList, function(p){ return p.txid; });

        stillWorkingRawActions = false;
        resolve();
      }
    }) //~ End of callback for request
  }); //~ End of promise block
}

async function getRamPriceData(endpoint) {
  return new Promise((resolve, reject) => {
    //~ console.log(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] Sending request for Ram data`);
    stillWorkingRam = true;

    //~ Try and get the latest RAM price
    let data = '{"json":true, "code":"eosio", "scope":"eosio", "table":"rammarket", "limit":10}';
    let json_obj = JSON.parse(data);
    request({
      url: `${nodeosEndpoints}/v1/chain/get_table_rows`,
      method: "POST",
      json: json_obj,
      timeout: 450
    }, function (error, response, body) {
      //~ console.log(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] Response received for getRamPriceData request..`);
      if (error) {
        //console.log('Error getting response from nodeos: ' + error);
        stillWorkingRam = false;
        reject(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] Error in Ram price request: ${error} | ${endpoint}`);
        //~ Todo: get last RAM price from the DB to put it in the new timeslot
      } else if (!body.rows) {
        //console.log(body);
        stillWorkingRam = false;
        reject(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] Error: response did not contain rammarket data | ${endpoint} | Status Code: ${response.statusCode}`);
        //~ Todo: get last RAM price from the DB to put it in the new timeslot
      } else {
        let ramBaseBalance = body.rows[0].base.balance; // Amount of RAM bytes in use
        ramBaseBalance = ramBaseBalance.substr(0, ramBaseBalance.indexOf(' '));
        let ramQuoteBalance = body.rows[0].quote.balance; // Amount of EOS in the RAM collector
        ramQuoteBalance = ramQuoteBalance.substr(0, ramQuoteBalance.indexOf(' '));
        ramPriceEos = (ramQuoteBalance / ramBaseBalance).toFixed(8); // Price in kb
        //return ramPriceEos;
        stillWorkingRam = false;
        resolve(ramPriceEos);
      }
    }) //~ End of callback for request
  }); //~ End of promise block
}

async function getVolData(endpoint) {
  return new Promise((resolve, reject) => {

    //~ console.log(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] Sending request for Vol data`);
    stillWorkingVol = true;
    let data = '{"account_name":"eosio.ram"}';
    let json_obj = JSON.parse(data);
    let eosRamAccBalance;

    request({
      url: `${nodeosEndpoints}/v1/chain/get_account`,
      method: "POST",
      json: json_obj,
      timeout: 450
    }, function (error, response, body) {
      //~ console.log(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] Response received for getVolData request..`);
      if (error) {
        //console.log('Error getting response from nodeos: ' + error);
        stillWorkingVol = false;
        reject(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] Error in Vol: ${error} | ${endpoint}`);
        //~ Todo: get last RAM price from the DB to put it in the new timeslot
      } else if (!body.core_liquid_balance) {
        //console.log('Error, unexpected response for currency stats: ' + body);
        stillWorkingVol = false;
        //reject(`Error: response did not contain volume eos balance data | ${endpoint} | Status Code: ${response.statusCode}`);
        //console.log(`No liquid balance getting info from: ${endpoint}`);
        reject(body);
        //~ Todo: get last RAM price from the DB to put it in the new timeslot
      } else {
        //~ console.log('ramAccEosBalance inside tryUpdateAndStoreVolume: ' + ramAccEosBalance);
        ramAccEosBalance = body.core_liquid_balance; // Amount of RAM bytes in use
        ramAccEosBalance = ramAccEosBalance.substr(0, ramAccEosBalance.indexOf(' '));
        //~ console.log('ramAccEosBalance: ' + ramAccEosBalance);
        //return eosRamAccBalance;
        stillWorkingVol = false;
        resolve(ramAccEosBalance);
      }
    }) //~ End of callback for request
  }); //~ End of promise block
}



function storeToDb(_timestamp, _open, _high, _low, _close, _volume) {
  //~ console.log(`Data: timestamp: ${_timestamp} | open: ${_open} | high: ${_high} | low: ${_low} | close: ${_close}`);
  data = `{
    "json": true,
    "timestamp": "${_timestamp}",
    "open": ${_open},
    "high": ${_high},
    "low": ${_low},
    "close": ${_close},
    "volume": ${_volume}
  }`;
  json_obj = JSON.parse(data);

  request({
    url: `${config.dbapi_url}/v1/store/ram/`,
    method: "POST",
    json: json_obj
  }, function (error, response, body) {
    if (error) {
      console.log(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] Error posting to DB API: ${error}`);
    } else {
      //~ console.log(body);
      if (response.statusCode == 200) {
        if (body.metadata.status == 'success') {
          console.log(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] Successfully posted to DB | timestamp: ${_timestamp} | open: ${_open} | high: ${_high} | low: ${_low} | close: ${_close} | Status: ${body.metadata.status}`);
        }
        else {
          console.log(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] DB write failed: ${body.metadata.status}`);
        }
      } else {
        console.log(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] Error posting to DB API | ${response.statusCode}: ${body}`);
      }
    }
  })
}

//~ Websocket / HTTP server
http.listen(config.server_port, () => {
  let now = moment().utc();
  console.log(`[${moment.utc().format()}] Web server listening on: ${config.server_port}`);

  //~ Websocket server handlers to handle incoming connections from the public API to subscribe to realtime updates
  io.on('connection', function (socket) {
    //~ A public API has connected and wants realtime updates
    let now = moment().utc();
    //console.log(now.format("YYYY-MM-DD HH:mm:ss.SSS") + '| New client connection from a public API: ' + socket.id);
  });

}).on('error', (e) => {
  console.log('Caught: ' + e);
});


function startTasks() {
  //~ Update data on intervals
  setInterval(() => {
    dataTickUpdateTask();
  }, 500);

  setInterval(() => {
    buildCandleTask();
  }, 10000);

  /*setInterval(() => {
    sendFakeCandle();
  }, 500);*/
}





//testNodes();
startTasks();
