const request = require('request');
const config = process.env;
const moment = require('moment');

/** Verify that environment variables we need are set, or initialize defaults **/
if (!config.dbapi_url) {
  let now = moment().utc();
  console.log(now.format("YYYY-MM-DD HH:mm:ss.SSS") + '| ****ERROR**** dbapi_url UNDEFINED. Initializing to default value \'http://localhost:6999\'');
  config.dbapi_url = 'http://localhost:6999';
}

if (!config.nodeos_url) {
  let now = moment().utc();
  console.log(now.format("YYYY-MM-DD HH:mm:ss.SSS") + '| ****ERROR**** nodeos_url UNDEFINED. Initializing to default value \'https://api.eosnewyork.io\'');
  config.nodeos_url = 'https://api.eosnewyork.io';
}
/*---------------------------*/

var ramAccEosBalance;

function postVolumeUpdate() {
  //~ console.log('ramAccEosBalance inside postVolumeUpdate: ' + ramAccEosBalance);
  //~ Now post a new record to the DB for this loop iteration using either
  //~ the new price or the last known price
  let now = moment().utc().format('YYYY-MM-DD HH:mm:ss.SSS');
  data = '{"json":true, "timestamp":' + '"' + now + '"' + ', "ramaccbal": ' + '"' + ramAccEosBalance + '"' + '}';
  json_obj = JSON.parse(data);
  request({
    url: `${config.dbapi_url}/v1/ram/volume`,
    method: "POST",
    json: json_obj
  }, function(error, response, body) {
    if (error) {
      console.log('Error posting to DB API: ' + error);
    } else {
      if (body.metadata.status == 'success') {
        console.log(now + '| Successfully posted to DB. Time: ' + now + ' | Volume: ' + ramAccEosBalance);
      }
      else {
        console.log(now + '| DB write failed: ' + body.metadata.status);
      }
    }
  })
}

function tryUpdateAndStoreVolume() {
  let data = '{"account_name":"eosio.ram"}';
  let json_obj = JSON.parse(data);

  request({
    url: `${config.nodeos_url}/v1/chain/get_account`,
    method: "POST",
    json: json_obj
  }, function(error, response, body) {
    if (error) {
      console.log('Error getting response from nodeos: ' + error);
      //~ Todo: get last RAM price from the DB to put it in the new timeslot
    } else if (!body.core_liquid_balance) {
      console.log('Error, unexpected response for currency stats: ' + body);
      //~ Todo: get last RAM price from the DB to put it in the new timeslot
    } else {
      //~ console.log('ramAccEosBalance inside tryUpdateAndStoreVolume: ' + ramAccEosBalance);
      ramAccEosBalance = body.core_liquid_balance; // Amount of RAM bytes in use
      ramAccEosBalance = ramAccEosBalance.substr(0,ramAccEosBalance.indexOf(' '));
      //~ console.log('ramAccEosBalance: ' + ramAccEosBalance);
      postVolumeUpdate();
    }
  })
}

//~ Update volume on interval
setInterval(() => {
  tryUpdateAndStoreVolume();
}, 100);
