require("dotenv").config()
const config = process.env;
const express = require('express')
const app = express();
const request = require('request');
const helmet = require('helmet');
// const rateLimit = require('express-rate-limit');
const http = require('http').Server(app);
const io = require('socket.io')(http);
const ioClient = require('socket.io-client')(config.pricescraper_url);
const moment = require("moment")
const cors = require("cors")

if (
  !process.env.pricescraper_url ||
  !process.env.server_port ||
  !process.env.dbapi_url
) {
  console.error("Error: missing environment variable")
  process.exit(0)
}

//~ Middleware
app.use(helmet());

if (process.env.NODE_ENV !== "production") {
  app.use(cors())
}

//~ Serve files in /public/ folder
app.use(express.static('public'));

app.get("/v1/ram/tv/:from/:to/:interval", (req, res) => {
  request(`${config.dbapi_url}/v1/ram/tv/${req.params.from}/${req.params.to}/${req.params.interval}`, { json: true }, (err, resi, body) => {
    if (err) { return console.log('Error communicating with DB API: ' + err); }
    res.status(resi.statusCode).send(body);
  })
})

//~ Launch the server
http.listen(config.server_port, () => {
  let now = moment().utc();
  //console.log(now.format("YYYY-MM-DD HH:mm:ss.SSS") + '| Public API successfully started on port: ' + config.server_port);

  io.on('connection', (socket) => {
    let now = moment().utc();
    //console.log(`${now.format("YYYY-MM-DD HH:mm:ss.SSS")} | New Socket connection on '/' channel`);
    //~ console.log('Generic catch-all for any socket connection')

  })

  //~ When an end-user connects
  io.of('/tv').on('connection', (socket) => {
    let now = moment().utc();
    console.log(`${now.format("YYYY-MM-DD HH:mm:ss.SSS")} | New end user client socket connection on '/tv' channel. ID:  ${socket.id}`);

    socket.on('getTime', (socket) => {
      const curTime = Math.floor(moment() / 1000);  //~ Give the time back in seconds
      let now = moment().utc();
      console.log(now.format("YYYY-MM-DD HH:mm:ss.SSS") + '| Received time request from end user client. Sending: ' + curTime);
      io.emit('timeResp', curTime);
    })
  })

  ioClient.on('connect', (socket) => {

    let now = moment().utc();
    console.log(now.format("YYYY-MM-DD HH:mm:ss.SSS") + '| Connected to realtime updates from price scraper.');
    //~ We are subscribed to realtime updates from the price scraper -- here we listen for messages from it

    io.of('/tv').emit('updatesRestored');
  })

  ioClient.on('newPriceUpdate', (data) => {
    console.log(`[${moment.utc().format()}] | New price update received from price scraper: ${data.timestamp} | ${data.price} | vol: ${data.volume} `);

    if (data) {
      //~ Send the new price update to the frontend
      io.of('/tv').emit('chartUpdate', data);
      //console.log(`[${moment.utc().format('YYYY-MM-DDTHH:mm:ss.SSS')}] New price update`)
    }
  })

  ioClient.on('newTradesListUpdate', (data) => {
    console.log(`[${moment.utc().format()}] | New recent trades list update received from price scraper: Array length: ${data.length}`);

    if (data) {
      //~ console.log(data);
      //~ console.log(`Emitting update for tradesListUpdate`);
      //~ Send the new trades history update to the frontend
      io.of('/tv').emit('tradesListUpdate', data);
    }

  })

  ioClient.on('disconnect', (error) => {
    let now = moment().utc();
    console.log(now.format("YYYY-MM-DD HH:mm:ss.SSS") + '| Socket: connection to price scraper interrupted. | ' + error);
    io.of('/tv').emit('updatesDelayed');
  });

  ioClient.on('connect_error', (error) => {
    let now = moment().utc();
    console.log(now.format("YYYY-MM-DD HH:mm:ss.SSS") + '| Socket: Error while connecting to price scraper. | ' + error);
    io.of('/tv').emit('updatesDelayed');
  });

  ioClient.on('connect_timeout', (error) => {
    let now = moment().utc();
    console.log(now.format("YYYY-MM-DD HH:mm:ss.SSS") + '| Socket: connection attempt to price scraper timed out. | ' + error);
  });

  ioClient.on('reconnecting', (attemptNumber) => {
    let now = moment().utc();
    console.log(now.format("YYYY-MM-DD HH:mm:ss.SSS") + '| Socket: attempting reconnect.. | #' + attemptNumber);
  });

  ioClient.on('reconnect_failed', () => {
    let now = moment().utc();
    console.log(now.format("YYYY-MM-DD HH:mm:ss.SSS") + '| Socket: reconnect attempt failed.');
  });

}).on('error', (e) => {
  console.log('Caught: ' + e);
});
