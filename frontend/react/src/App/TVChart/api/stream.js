/*******************************
* Copyright 2018 Andrew Coutts
********************************/
import historyProvider from './historyProvider.js'
const config = require('./conf')
const moment = require('moment');
const io = require('socket.io-client')

//~ Replace this URL with the public API endpoint
let socket_url = `${config.websocket.protocol}://${config.websocket.host}:${config.websocket.port}/tv`;

//var socket_url = 'http://localhost:8079'
//~ TODO: add a config file for this setting
//~ var socket_url = 'https://api.buyeosram.io'
//var socket = io(socket_url, {transports: ['websocket']});
var socket = io(socket_url, {transports: ['websocket']});

//~ Subscription information
var sub = {
  symbolInfo: '',
  resolution: '',
  updateCb: '',
  uid: '',
  resetCache: '',
  lastBar: ''
}

var frontendSubscriptions = {
  handleNewPriceChange: '',
  handleNewTradesChange: '',
  handleSocketConnectionStatus: function (status) {
    
  }
}

//~ Set initial state
var subscribed = false;
var frontendSubscribed = false;

export default {

  //~ Subsribe the frontend handlers in React to get realtime data from the websocket
  subscribeFrontend: function(_handleNewPriceChange, _handleNewTradesChange, _handleSocketConnectionStatus) {
    frontendSubscriptions.handleNewPriceChange = _handleNewPriceChange;
    frontendSubscriptions.handleNewTradesChange = _handleNewTradesChange;
    frontendSubscriptions.handleSocketConnectionStatus = _handleSocketConnectionStatus;
    //~ console.log(`Subscribed to socket updates from react: ${_handleNewPriceChange} | ${_handleNewTradesChange}`);
    frontendSubscribed = true;
  },

  //~ Subscribe the TV chart to realtime updates from the websocket connection
  subscribeBars: function(_symbolInfo, _resolution, _updateCb, _uid, _resetCache) {
    sub.symbolInfo = _symbolInfo;
    sub.resolution = _resolution;
    sub.updateCb = _updateCb;
    sub.uid = _uid;
    sub.resetCache = _resetCache;
    sub.lastBar = historyProvider.history[_symbolInfo.name].lastBar;
    //~ console.log('sombolinfo.name: ' + _symbolInfo.name);

    subscribed = true;
  },

  unsubscribeBars: function(uid) {
    //~ TODO: implement this if there are multiple symbols to change between
    subscribed = false;
  },

  getServerTime: function(cb) {
    socket.emit('getTime');

    socket.on('timeResp', (time) => {
      //~ console.log('Time returned: ' + time);
      cb(time);
    })
  }
}


socket.on('connect', () => {
  frontendSubscriptions.handleSocketConnectionStatus('Connecting..');
  //~ console.log('===Socket connected')
  //document.getElementById("connectionStatus").innerHTML = "Realtime";
  //document.getElementById("connectionStatus").classList.remove("badge-info");
  //document.getElementById("connectionStatus").classList.remove("badge-warning");
  //document.getElementById("connectionStatus").classList.add("badge-success");
  //~ console.log('Socket: realtime API connection established.');
})


//~ We have an incoming update from the price sublic API
socket.on('chartUpdate', (data) => {
  //console.log(`Received update for chart. frontendSubscribed: ${frontendSubscribed}`);
  //~ console.log(data);
  //~ console.log('lastBar: ' + sub.lastBar.time);
  //console.log(data.time + ' | ' + data.price);
  //~ console.log(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] ${data.timestamp} | Price: ${data.price} | Volume: ${data.volume}`);
  if (subscribed) {
    let newBar = updateBar(data);
    // send the most recent bar back to TV's realtimeUpdate callback
    sub.updateCb(newBar);
    // update our own record of lastBar
    sub.lastBar = newBar;
  }

  //~ Send new bar to react components
  if (frontendSubscribed) {
    frontendSubscriptions.handleSocketConnectionStatus('Realtime');
    //~ console.log(`emitting event to react frontend`);
    frontendSubscriptions.handleNewPriceChange(data);
  }
})

socket.on('tradesListUpdate', (tradesArray) => {
  //~ console.log(`Received update for trades`);
  //~ console.log(`new trades list update`);
  //~ Send updated recent 100 trades list to react components
  if (frontendSubscribed) {
    //~ console.log(`emitting event to react frontend`);
    //~console.log(tradesArray[0]);
    frontendSubscriptions.handleNewTradesChange(tradesArray);
  }
})

socket.on('disconnect', (error) => {
  frontendSubscriptions.handleSocketConnectionStatus('Disconnected');
  //~ document.getElementById("connectionStatus").innerHTML = "Updates Delayed";
  //~ console.log('Socket: connection to API interrupted. | ' + error);
  //~ document.getElementById("connectionStatus").classList.remove("badge-info");
  //~ document.getElementById("connectionStatus").classList.remove("badge-success");
  //~ document.getElementById("connectionStatus").classList.add("badge-warning");

});

socket.on('connect_error', (error) => {
  frontendSubscriptions.handleSocketConnectionStatus('Connection Error');
  //~ document.getElementById("connectionStatus").innerHTML = "Updates Delayed";
  //~ console.log('Socket: Error while connecting to API. | ' + error);
  //~ document.getElementById("connectionStatus").classList.remove("badge-info");
  //~ document.getElementById("connectionStatus").classList.remove("badge-success");
  //~ document.getElementById("connectionStatus").classList.add("badge-warning");
});

socket.on('connect_timeout', (error) => {
  frontendSubscriptions.handleSocketConnectionStatus('Connection Timeout');
  //~ document.getElementById("connectionStatus").innerHTML = "Socket Timeout";
  //~ console.log('Socket: connection attempt to API timed out. | ' + error);
});

socket.on('reconnect_attempt', (attemptNumber) => {
  frontendSubscriptions.handleSocketConnectionStatus('Reconnecting..');
  //~ document.getElementById("connectionStatus").innerHTML = "Socket Reconnecting.. #" + attemptNumber;
  //~ console.log('Socket: attempting reconnect.. | #' + attemptNumber);
  //~ document.getElementById("connectionStatus").classList.remove("badge-info");
  //~ document.getElementById("connectionStatus").classList.remove("badge-success");
  //~ document.getElementById("connectionStatus").classList.add("badge-warning");
});

socket.on('reconnect_failed', () => {
  frontendSubscriptions.handleSocketConnectionStatus('Reconnect Failed');
  //~ document.getElementById("connectionStatus").innerHTML = "Socket Reconnect Failed";
  //~ console.log('Socket: reconnect attempt failed.');
});

socket.on('updatesDelayed', () => {
  frontendSubscriptions.handleSocketConnectionStatus('Updates Delayed');
  //~ console.log('Realtime updates temporarily delayed.');
  //~ document.getElementById("connectionStatus").innerHTML = "Updates Delayed";
  //~ document.getElementById("connectionStatus").classList.remove("badge-info");
  //~ document.getElementById("connectionStatus").classList.remove("badge-success");
  //~ document.getElementById("connectionStatus").classList.add("badge-warning");
})

socket.on('updatesRestored', () => {
  frontendSubscriptions.handleSocketConnectionStatus('Realtime');
  //~ console.log('Realtime data connection restored.');
  //~ document.getElementById("connectionStatus").innerHTML = "Realtime Data";
  //~ document.getElementById("connectionStatus").classList.remove("badge-info");
  //~ document.getElementById("connectionStatus").classList.remove("badge-warning");
  //~ document.getElementById("connectionStatus").classList.add("badge-success");
})


function updateBar(data) {
  //~ Data structure: {time, peos}
  //~ Convert price from bytes to kilobytes
  let peos = parseFloat(data.price * 1024);
  let dataTime = Date.parse(data.timestamp); //~ The date/time comes in as an ISO8601 string, convert to milliseconds

  let lastBar = sub.lastBar;  //~ Grab the last bar from the history provider
  let resolution = sub.resolution;
  let rounded;  //~ Will be used to round the current candle time down and compare if we should start a new candle or update the existing one
  //~ console.log('raw resolution: ' + resolution);
  //~ console.log('1)data.time of new bar: ' + dataTime);
  //~ console.log('3)Resolution: ' + resolution);

  switch (resolution) {
    case 'D':
    //~ Round the latest tick time to the nearest day
    rounded = moment(dataTime).utc().startOf('day');
    //~ console.log('rounded(Day): ' + rounded);
    break;

    case '1S':
    case '5S':
    case '10S':
    case '15S':
    case '30S':
    //~ Since the API speaks in seconds, we just need to strip off the 'S' for the 'seconds' resolution cases
    resolution = resolution.substr(0, resolution.indexOf('S'));
    //~ console.log('Resolution for seconds case after stripping off S: ' + resolution);
    break;

    default:
    //~ Default case is we are dealing with a resolution in minutes, so we just multiply it by 60
    //~ to get the appropriate value in seconds which is what the public API speaks in.
    resolution *= 60;
    break;
  }

  //~ console.log('Resolution updated: ' + resolution);

  //~ Do the rounding on values that aren't 1D since we already did that in the switch statement
  if (resolution !== 'D') {
    let coeff = resolution * 1000;
    rounded = Math.floor(dataTime / coeff) * coeff;
    //~ console.log('coeff: ' + coeff);
  }
  //~ console.log('rounded: ' + rounded);

  let lastBarSec = lastBar.time;
  let _lastBar;
  //~ console.log('2)lastBarSec of last bar: ' + lastBarSec);

  //~ If current bar time is > end time for last bar
  if (rounded > lastBarSec) {
    //~ console.log('rounded>lastBarSec, creating new bar');
    _lastBar = {
      time: rounded,      //~ Start a new candle with the time as the next rounded time period
      open: lastBar.close,
      high: lastBar.close,
      low: lastBar.close,
      close: peos,
      volume: data.volume
    }

  } else {
    //~ console.log('rounded<=lastBarSec, updating existing bar');
    //~ console.log('lastbar low: ' + lastBar.low);
    //~ console.log('lastbar high: ' + lastBar.high);
    //~ Update existing candle
    if (peos < lastBar.low) {
      lastBar.low = peos
    } else if (peos > lastBar.high) {
      lastBar.high = peos
    }

    lastBar.volume += data.volume;
    //~ console.log(`Volume inside update bar routine: ${data.volume}`);
    lastBar.close = peos;
    _lastBar = lastBar;
  }

  return _lastBar
}
