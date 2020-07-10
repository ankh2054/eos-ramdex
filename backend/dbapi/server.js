require("dotenv").config()
const config = process.env;
const moment = require('moment');
const express = require('express');
const logger = require('morgan');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const app = express();
const ramController = require('./controllers/ram');

if (
  !process.env.server_port ||
  !process.env.db_host ||
  !process.env.db_port ||
  !process.env.db_database ||
  !process.env.db_user ||
  !process.env.db_password ||
  !process.env.writemode ||
  !process.env.version ||
  !process.env.server_port
) {
  console.error("Error: missing environment variable")
  process.exit(0)
}

//~ Middleware
//~ Log requests to the console
app.use(logger('dev'));
app.use(helmet());

//~ Parse incoming requests data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//~ For DEBUG only
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});


//~~~~ LEGACY
//~ Get route - range of data in minutes and interval of data in seconds
//~ app.route('/v1/ram/:range/:interval').get(ramController.getData);

//~~~~ POSTS
app.route('/v1/store/ram').post(ramController.storeRamData); //~ For new price scraper with volume storage into processed 5s candles table
app.route('/v1/ram').post(ramController.storeData); //~ LEGACY: For price scraper
app.route('/v1/ram/volume').post(ramController.storeVolData); //~ For volume scraper
app.route('/v1/ram/stats/').post(ramController.storeRamUtilStats); //~ For ram stats scraper

//~~~~ GETS
app.route('/v1/ram/latest').get(ramController.v2GetLatest); //~ Get latest price record
app.route('/v1/ram/stats/latest').get(ramController.getLatestRamStats); //~ Get latest ram stats record
app.route('/v1/ram/tv/:from/:to/:interval').get(ramController.getTvCached); //~ For TV API
app.route('/healthcheck').get(ramController.healthcheck); //~ LB healthcheck


//~ Generic 404 errors for invalid URLs
app.route('*')
  .get(ramController.genericResp)
  .post(ramController.genericResp);

//~ Launch the server
app.listen(config.server_port, () => {
  console.log(moment().utc().format("YYYY-MM-DD HH:mm:ss.SSS") + '| DB API successfully started on port: ' + config.server_port);
}).on('error', (e) => {
  console.log('Caught: ' + e);
});
