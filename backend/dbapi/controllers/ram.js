//~const db = require('../db');
const db = require('../db').db;
const config = process.env;
const moment = require('moment');

const Cache = require('mahsan');
const cache1s = new Cache();
const cache1m = new Cache();
const cache1h = new Cache();
const cache1d = new Cache();
var cache = cache1s;


const intervals = {
  FIVEYEARS:      60*60*24*365*5,
  THREEYEARS:     60*60*24*365*3,
  ONEYEAR:        60*60*24*365,
  SIXMONTHS:      60*60*24*182,
  ONEMONTH:       (60*60*24*365)/12,
  NINETYDAYS:     60*60*24*90,
  TWOWEEKS:       60*60*24*7*2,
  ONEWEEK:        60*60*24*7,
  THREEDAYS:      60*60*24*3,
  ONEDAY:         60*60*24,
  EIGHTEENHOURS:  60*60*18,
  TWELVEHOURS:    60*60*12,
  EIGHTHOURS:     60*60*8,
  SIXHOURS:       60*60*6,
  FOURHOURS:      60*60*4,
  TWOHOURS:       60*60*2,
  ONEHOUR:        60*60*1,
  THIRTYMINUTES:  60*30
};


module.exports = {

  //~ With caching in Redis
  getTvCached: async (req, res) => {
    //~ console.log(`[${moment.utc().format()}]////////////////////////////////////////////////////////////////////////////////////////////////////////////////////`);

    const interval = req.params.interval;
    //~ Data granularity options -- used to limit the API look-back at different resolutions

    let from = moment.unix(req.params.from).utc().format();
    const to = moment.unix(req.params.to).utc().format();

    //~ console.log(`[${moment.utc().format()}] 1) Date check | From: ${from} | To: ${to}`);


    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //~ Enforce look-back limits on data range requested
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    let limit;
    //~ console.log(`[${moment.utc().format()}] Received request for interval: ${interval}`);
    switch (interval) {
      //~ 1 sec to 30 sec intervals
      case '1': //~ ** TV will build these intervals with 1 sec candles
      case '5':
      case '10':
      case '15':
      case '30':
        //~ Max lookback is 1D
        //~ console.log(`Re-checking, the to value was: ${to}`);
        limit = moment.utc().subtract(intervals.ONEDAY, 'seconds').format();
        //~ console.log(`[${moment().utc().format()}] New Limit with strict look-back period enforced: ${limit}`);
        if (from < limit) {
          //~ console.log(`[${moment().utc().format()}] Implementing data return limit of: 1D`);
        }
        break;

      //~ 1 min to 45 min intervals
      case '60':  //~ ** TV will build these intervals with 1 min candles
      case '120':
      case '180':
      case '300':
      case '600':
      case '900':
      case '1800':
      case '2700':
        //~ Max lookback is 1M
        //~ console.log(`Re-checking, the to value was: ${to}`);
        limit = moment.utc().subtract(intervals.ONEMONTH, 'seconds').format();
        //~ console.log(`[${moment().utc().format()}] New Limit with strict look-back period enforced: ${limit}`);
        if (from < limit) {
          //~ console.log(`[${moment().utc().format()}] Implementing data return limit of: 1M`);
        }
        break;

      //~ 1hr to 12 hr intervals
      case '3600': //~ ** TV will build these intervals with 1 hour candles
      case '7200':
      case '10800':
      case '14400':
      case '28800':
      case '43200':
        //~ Max lookback is 1Y
        //~ console.log(`Re-checking, the to value was: ${to}`);
        limit = moment.utc().subtract(intervals.ONEYEAR, 'seconds').format();
        //~ console.log(`[${moment().utc().format()}] New Limit with strict look-back period enforced: ${limit}`);
        if (from < limit) {
          //~ console.log(`[${moment().utc().format()}] Implementing data return limit of: 1Y`);
        }
        break;

      //~ 1D interval
      case '86400': //~ ** TV will build these intervals with 1 day candles
        //~ Max lookback is 3Y
        //~ console.log(`Re-checking, the to value was: ${to}`);
        limit = moment.utc().subtract(intervals.THREEYEARS, 'seconds').format();
        //~ console.log(`[${moment().utc().format()}] New Limit with strict look-back period enforced: ${limit}`);
        if (from < limit) {
          //~ console.log(`[${moment().utc().format()}] Implementing data return limit of: 3Y`);
        }
        break;

      //~ No limit for timeframes 1D or greater for now
      default:
        console.log(`[${moment().utc().format()}] Received malformatted request for interval: ${interval}`);
        return res.status(400).send('Error: bad request.');
    }

    //~ console.log("raw now: " + now);
    //~ console.log("to: " + to);
    //~ console.log("initial from: " + from);
    //~ console.log("now: " + moment(now).utc().format("YYYY-MM-DD HH:mm:ss.SSS"));
    //~ console.log("limit: " + limit);

    //~ If we detected a limit condition above, here we just override the requested 'from' range to the limit (our new max)
    if (limit) {
      //~ console.log('We have a limit value. Initial From: ' + from);
      if (from < limit) {
        //~ console.log("Requested FROM date is before the limit, overriding to the limit");
        from = limit;
        //~ console.log("New from: " + from);
      }
    }


    /*****************************************************************/
    /** Assign which cache object we will use based on the interval **/
    /*****************************************************************/
    //~ console.log(`[${moment().utc().format()}] | Interval we are about to process: ${interval}`);
    let intervalString;
    switch (interval) {
      case '86400':  //~ 1 day bars
      intervalString = 'day';
      cache = cache1d;
      break;

      case '3600':  //~ 1 hour bars
      intervalString = 'hour';
      cache = cache1h;
      break;

      case '60': //~ 1 minute bars
      intervalString = 'minute';
      cache = cache1m;
      break;

      case '1': //~ 1 second bars
      intervalString = 'seconds';
      cache = cache1s;
      break;
    }

    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //~ Get things from the cache or DB and return the result
    //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    //~ console.time('query');
    try {
      //~ console.log(`[${moment.utc().format()}] ************************ Rounding down the 'from' time to the nearest round period`);
      from = moment.utc(from).startOf(intervalString).format(); //~ Round for time period
      //~ console.log(`[${moment.utc().format()}] 2) Date check | From: ${from} | To: ${to}`);

      //~ console.log(`[${moment.utc().format()}] ************************ Counting how many intervals exist in our to/from range`)
      let numPeriods = moment.utc(to).diff(from, intervalString);  //~ How many hours in the period
      //~ console.log(`[${moment.utc().format()}] Time range is from ${from} to ${to}`);
      //~ console.log(`[${moment.utc().format()}] Number of '${intervalString}' periods in range: ${numPeriods}`);

      var newResultBars = [];
      let curLoopTimestamp = moment.utc(from).format();
      var lastKnownCacheHitTimestamp; //~ Last known not-null value in cache containing price information
      var numCacheHits = 0;

      //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      //~ Main cache-checking routine loop
      //~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
      //~ console.log(`[${moment.utc().format()}] ************************ Checking to see if each bar exists in cache before we go to the DB for it`);
      for (let i=0; i<numPeriods; i++) {
        let cacheHitBar = {
          candle: curLoopTimestamp,
          open: '',
          high: '',
          low: '',
          close: '',
          volume: ''
        };
        //~ console.log(`Checking for bar at hash: ${curLoopTimestamp}`);
        const rawCacheReadResult = await cache.get(curLoopTimestamp);

        //~ Positive cache hit if there is a candle close value
        if (rawCacheReadResult) {
          cacheHitBar.open = rawCacheReadResult.open;
          cacheHitBar.high = rawCacheReadResult.high;
          cacheHitBar.low = rawCacheReadResult.low;
          cacheHitBar.close = rawCacheReadResult.close;
          cacheHitBar.volume = rawCacheReadResult.volume;
          numCacheHits++; //~ Increment the # of cache hits
          lastKnownCacheHitTimestamp = curLoopTimestamp; //~ Set the last known cache hit to the current one since it was a hit
          //~ console.log(`>>>>>> CACHE HIT | ${cacheHitBar.candle} | o: ${rawCacheReadResult.open}, h: ${rawCacheReadResult.high}, l: ${rawCacheReadResult.low}, c: ${rawCacheReadResult.close}, v: ${rawCacheReadResult.volume}`)
          newResultBars.push(cacheHitBar); //~ Add this bar to our final result set
        }

        //~ On loop continue, increment the time period for the next go
        curLoopTimestamp = moment.utc(curLoopTimestamp).add(1, intervalString).format();
      }
      //~ console.log(`[${moment.utc().format()}] ************************ Done checking cache for hits`);

      if (numCacheHits) {
        console.log(`[${moment.utc().format()}] ******************************************** Total cache hits: ${numCacheHits}`);
        lastKnownCacheHitTimestamp = moment.utc(lastKnownCacheHitTimestamp).add(1, intervalString).format();  //~ Increment the last known cache hit so the DB can query from the next value and not add the same row twice to the result set
      } else {
        console.log(`[${moment.utc().format()}] ********************** WARNING: No results found in cache`);
        lastKnownCacheHitTimestamp = from; //~ Since we don't have any known cache hits, set the last known cache hit to the from value so the DB can be queried from here
      }

    }
    catch(e) {
      console.log(`[${moment.utc().format()}] Error caught in controllers/ram.js while looking for values in cache: ${e}`);
      //returnStatus = 400;
      //res.status(400).send('Error getting records: ' + e);
    }

    //~ Try to get any bars that weren't found in cache from the DB
    try {
      //~~~~~~~~~~~~~~~~~~~~~~~ DEBUG
      //~ console.log(`[${moment.utc().format()}] ************************ Calculating bars we need to get from the DB`);
      numPeriods = moment.utc(to).diff(lastKnownCacheHitTimestamp, intervalString);  //~ How many intervals are in the period
      //~ console.log(`[${moment.utc().format()}] New time range is from ${lastKnownCacheHitTimestamp} to ${to}`);
      //~ console.log(`[${moment.utc().format()}] Number of '${intervalString}' periods in new range: ${numPeriods}`);
      //~~~~~~~~~~~~~~~~~~~~~~~

      var dbResult = await db.any(`
        SELECT time_bucket($1, timestamp) AS candle,
        (first(open, timestamp)) o,
        MAX(high) h,
        MIN(low) l,
        (last(close, timestamp)) c,
        SUM(volume) v
        FROM wax.candles10s
        WHERE timestamp BETWEEN $2 AND $3
        GROUP BY candle
        ORDER BY candle ASC;`, [req.params.interval + ' seconds', lastKnownCacheHitTimestamp, to]);
      //console.log(dbResult);
      //~ console.log(`[${moment.utc().format()}] ************************ Done getting missing bars from DB. Now adding to cache and result array. Number of rows returned: ${dbResult.length}`);
      dbResult.forEach(async (element) => {
        //~ console.log(element);
        let resultBar = {
          candle: element.candle,
          open: element.o,
          high: element.h,
          low: element.l,
          close: element.c,
          volume: element.v
        }
        newResultBars.push(resultBar);

        let cacheBar = {
          open: element.o,
          high: element.h,
          low: element.l,
          close: element.c,
          volume: element.v
        }
        //~ console.log('-------------------')
        //~ console.log(cacheBar);
        //~ console.log('-------------------')
        await cache.set(element.candle, cacheBar);
      })
      //console.log(`[${moment.utc().format("YYYY-MM-DD HH:mm:ss.SSS")}] Results: ${dbResult}`);

    } catch(e) {
      console.log(`[${moment.utc().format()}] Error caught in controllers/ram.js while attempting to get missing bars from DB: ${e}`);
      //returnStatus = 400;
      //res.status(400).send('Error getting records: ' + e);
    }

    //~ console.log(`/////////////////////////////////////////////// DONE - SENDING RESULT`);
    res.status(200).send(newResultBars);
    //~ console.timeEnd('query');
  },


  //~ LEGACY
  //~ This routine stores a new record in the DB.
  //~ This is mainly used by the price scraper to store new values
  storeData: async (req, res) => {
    try {
      if (config.writemode == 'enabled') {
        const query = await db.any(`INSERT INTO eosram(dt, peos) VALUES($1, $2)`, [req.body.timestamp, req.body.peos]);
        res.status(200).json(
          {
            'data': {
              'dt': req.body.timestamp,
              'peos': req.body.peos,
            },
            'metadata': {
              'type': 'POST',
              'status': 'success'
            }
          }
        );
      }
      else {
        console.log('Write mode disabled! Did not save the following data: ' + req.body.timestamp + ' | ' + req.body.peos);
        res.status(200).json(
          {
            'data': {
              'dt': req.body.timestamp,
              'peos': req.body.peos,
            },
            'metadata': {
              'type': 'POST',
              'status': 'Failed - DB API write mode disabled'
            }
          }
        );
      }

    }
    catch(e) {
      console.log('Error caught in models/ram.js inside storeData(): ' + e);
      res.status(400).send('Error inserting record.');
    }
  },


  /********************************************************************
   *  V2 | New routine to store processed 1s candles into a new table
   ********************************************************************/
  storeRamData: async (req, res) => {
    try {
      if (config.writemode == 'enabled') {
        const query = await db.any(`INSERT INTO wax.candles10s(timestamp, open, high, low, close, volume) VALUES($1, $2, $3, $4, $5, $6)`, [req.body.timestamp, req.body.open, req.body.high, req.body.low, req.body.close, req.body.volume]);
        //~ console.log(`[${moment.utc().format()}] Inserted new row into table 'eosram5s': ${req.body.timestamp} | o: ${req.body.open} | h: ${req.body.high} | l: ${req.body.low} | c: ${req.body.close} | v: ${req.body.volume}`);
        res.status(200).json(
          {
            'data': {
              'timestamp': req.body.timestamp,
              'open': req.body.open,
              'high': req.body.high,
              'low': req.body.low,
              'close': req.body.close,
              'volume': req.body.volume,
            },
            'metadata': {
              'type': 'POST',
              'status': 'success'
            }
          }
        );
      }
      else {
        console.log(`[${moment.utc().format()}] Write mode disabled! Did not save the following data: ${req.body.timestamp} | ${req.body.open} | ${req.body.high} | ${req.body.low} | ${req.body.close} | ${req.body.volume}`);
        res.status(200).json(
          {
            'data': {
              'timestamp': req.body.timestamp,
              'open': req.body.open,
              'high': req.body.high,
              'low': req.body.low,
              'close': req.body.close,
              'volume': req.body.volume,
            },
            'metadata': {
              'type': 'POST',
              'status': 'Failed - DB API write mode disabled'
            }
          }
        );
      }

    }
    catch(e) {
      console.log(`[${moment.utc().format()}] Error caught in models/ram.js inside storeData(): ${e}`);
      res.status(400).send(`Error inserting record: ${e}`);
    }
  },



  storeRamUtilStats: async (req, res) => {
    try {
      if (config.writemode == 'enabled') {
        const query = await db.any(`INSERT INTO ramreservedstats(dt, maxrambytes, reservedbytes, reservedpct) VALUES($1, $2, $3, $4)`, [req.body.timestamp, req.body.maxrambytes, req.body.reservedbytes, req.body.reservedpct]);
        res.status(200).json(
          {
            'data': {
              'dt': req.body.timestamp,
              'maxrambytes': req.body.maxrambytes,
              'reservedbytes': req.body.reservedbytes,
              'reservedpct': req.body.reservedpct,
            },
            'metadata': {
              'type': 'POST',
              'status': 'success'
            }
          }
        );
        //~ DEBUG
        //~ console.log('Successfully inserted new volume record. ' + req.body.timestamp + ' | ' + req.body.ramaccbal);
      } else {
        console.log('Write mode disabled! Did not save the following data: ' + req.body.timestamp + ' | ' + req.body.maxrambytes + ' | ' + req.body.reservedbytes + ' | ' + req.body.reservedpct);
        res.status(200).json(
          {
            'data': {
              'dt': req.body.timestamp,
              'ramaccbal': req.body.ramaccbal,
            },
            'metadata': {
              'type': 'POST',
              'status': 'Failed - DB API write mode disabled'
            }
          }
        );
      }
    }
    catch(e) {
      console.log('Error caught in models/ram.js inside storeRamUtilStats(): ' + e);
      res.status(400).send('Error inserting record: ' + e);
    }
  },






  //~ Store volume data
  storeVolData: async (req, res) => {
    //~ console.log('timestamp: ' + req.body.timestamp + " | ramaccbal: " + req.body.ramaccbal);
    try {
      if (config.writemode == 'enabled') {
        const query = await db.any(`INSERT INTO eosramvol(dt, ramaccbal) VALUES($1, $2)`, [req.body.timestamp, req.body.ramaccbal]);
        res.status(200).json(
          {
            'data': {
              'dt': req.body.timestamp,
              'ramaccbal': req.body.ramaccbal,
            },
            'metadata': {
              'type': 'POST',
              'status': 'success'
            }
          }
        );
        //~ DEBUG
        //~ console.log('Successfully inserted new volume record. ' + req.body.timestamp + ' | ' + req.body.ramaccbal);
      } else {
        console.log('Write mode disabled! Did not save the following data: ' + req.body.timestamp + ' | ' + req.body.ramaccbal);
        res.status(200).json(
          {
            'data': {
              'dt': req.body.timestamp,
              'ramaccbal': req.body.ramaccbal,
            },
            'metadata': {
              'type': 'POST',
              'status': 'Failed - DB API write mode disabled'
            }
          }
        );
      }
    }
    catch(e) {
      console.log('Error caught in models/ram.js inside storeVolData(): ' + e);
      res.status(400).send('Error inserting record: ' + e);
    }
  },





  //~ Legacy without caching-direct call to DB
  getTv: async (req, res) => {
    const interval = req.params.interval;
    //~ Data granularity options -- used to limit the API look-back at different resolutions

    let from = moment.unix(req.params.from).utc().format("YYYY-MM-DD HH:mm:ss.SSS");
    const to = moment.unix(req.params.to).utc().format("YYYY-MM-DD HH:mm:ss.SSS");

    const now = moment().utc();
    let limit;

    switch (interval) {
      //~ 1 sec to 30 sec intervals
      case '1':
      case '5':
      case '10':
      case '15':
      case '30':
        //~ Max lookback is 3D
        limit = moment(now - intervals.THREEDAYS).utc().format("YYYY-MM-DD HH:mm:ss.SSS");
        if (from < limit) {
          console.log(now.format("YYYY-MM-DD HH:mm:ss.SSS") + '| Implementing data return limit of: 3 days');
        }
        break;

      //~ 1 min to 5 min intervals
      case '60':
      case '120':
      case '180':
      case '300':
        //~ Max lookback is 1W
        limit = moment(now - intervals.ONEWEEK).utc().format("YYYY-MM-DD HH:mm:ss.SSS");
        if (from < limit) {
          console.log(now.format("YYYY-MM-DD HH:mm:ss.SSS") + '| Implementing data return limit of: 1 week');
        }
        break;

      //~ 10 min to 45 min intervals
      case '600':
      case '900':
      case '1800':
      case '2700':
        //~ Max lookback is 1M
        limit = moment(now - intervals.ONEMONTH).utc().format("YYYY-MM-DD HH:mm:ss.SSS");
        if (from < limit) {
          console.log(now.format("YYYY-MM-DD HH:mm:ss.SSS") + '| Implementing data return limit of: 1 month');
        }
        break;

      //~ 1hr to 12 hr intervals
      case '3600':
      case '7200':
      case '10800':
      case '14400':
      case '28800':
      case '43200':
        //~ Max lookback is 1Y
        limit = moment(now - intervals.ONEYEAR).utc().format("YYYY-MM-DD HH:mm:ss.SSS");
        if (from < limit) {
          console.log(now.format("YYYY-MM-DD HH:mm:ss.SSS") + '| Implementing data return limit of: 1 year');
        }
        break;

      case '86400':
        //~ Max lookback is 3Y
        limit = moment(now - intervals.THREEYEARS).utc().format("YYYY-MM-DD HH:mm:ss.SSS");
        if (from < limit) {
          console.log(now.format("YYYY-MM-DD HH:mm:ss.SSS") + '| Implementing data return limit of: 3 years');
        }
        break;

      //~ No limit for timeframes 1D or greater for now
      default:
        console.log(now.format("YYYY-MM-DD HH:mm:ss.SSS") + '| Received malformatted request for interval: ' + interval);
        return res.status(400).send('Error: bad request.');
    }

    //~ console.log("raw now: " + now);
    //~ console.log("to: " + to);
    //~ console.log("initial from: " + from);
    //~ console.log("now: " + moment(now).utc().format("YYYY-MM-DD HH:mm:ss.SSS"));
    //~ console.log("limit: " + limit);

    //~ If we detected a limit condition above, here we just override the requested 'from' range to the limit (our new max)
    if (limit) {
      //~ console.log('We have a limit value. Initial From: ' + from);
      if (from < limit) {
        //~ console.log("Requested FROM date is before the limit, overriding to the limit");
        //from = limit;
        //~ console.log("New from: " + from);
      }
    }

    try {
      //~ console.log("inside Try, from: " + from);

      //~ Execute the SELECT statement using the new 'from' limit if applied above
      console.log('Getting result from the DB');
      const result = await db.any(`
        SELECT time_bucket($1, dt) AS timestamp,
        (first(peos, dt)) o,
        MAX(peos) h,
        MIN(peos) l,
        (last(peos, dt)) c
        FROM wax.candles10s
	      WHERE dt BETWEEN $2 AND $3
        GROUP BY timestamp
        ORDER BY timestamp ASC;`, [req.params.interval + ' seconds', from, to]);
      res.status(200).send(result);
      //console.log(result);
    }
    catch(e) {
      console.log('Error caught in controllers/ram.js inside getTv(): ' + e);
      res.status(400).send('Error getting records: ' + e);
    }
  },

  //~ Mainly used for testing to make sure the DB is working- simply return the last row
  v2GetLatest: async (req, res) => {
    try {
      const result = await db.any('SELECT * FROM wax.candles10s ORDER BY timestamp DESC LIMIT 1');
      res.status(200).send(result);
    }
    catch(e) {
      console.log(`[${moment.utc().format()}] Error caught in models/ram.js inside v2GetLatest(): ${e}`);
      res.status(400).send(`Error getting record: ${e}`);
    }
  },

  //~ LEGACY
  //~ Mainly used for testing to make sure the DB is working- simply return the last row
  getLatest: async (req, res) => {
    try {
      const result = await db.any('SELECT * FROM eosram ORDER BY dt DESC LIMIT 1');
      res.status(200).send(result);
    }
    catch(e) {
      console.log('Error caught in models/ram.js inside getLatest(): ' + e);
      res.status(400).send('Error getting records.');
    }
  },

  getLatestRamStats: async (req, res) => {
    try {
      const result = await db.any('SELECT * FROM ramreservedstats ORDER BY dt DESC LIMIT 1');
      res.status(200).send(result);
    }
    catch(e) {
      console.log('Error caught in models/ram.js inside getLatestRamStats(): ' + e);
      res.status(400).send('Error getting records.');
    }
  },

  preloadCache: async (req, res) => {

  },

  //~ Healthcheck
  healthcheck: (req, res) => {
    res.status(210).send('OK - ' + config.version);
  },

  //~ Catch-all
  genericResp: (req, res) => {
    res.status(400).send('Error in request');
  },

}
