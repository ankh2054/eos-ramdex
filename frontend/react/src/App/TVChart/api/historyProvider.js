/*******************************
* Copyright 2018 Andrew Coutts
********************************/
var rp = require('request-promise').defaults({json: true})
const config = require('./conf')
const history = {}

export default {
	history: history,

	getBarsEos: function(symbolInfo, resolution, from, to, first, limit) {
		//~ console.log("historyProvider | Resolution: " + resolution);
		var urlBase = `${config.publicapi.protocol}://${config.publicapi.host}:${config.publicapi.port}/v1/ram/tv`;
		var urlInterval = resolution === 'D' ? 60*60*24 : resolution === '1D' ? 60*60*24 : resolution === '30S' ? 1 : resolution === '15S' ? 1 : resolution === '10S' ? 1 : resolution === '5S' ? 1 : resolution === '1S' ? 1 : resolution*60;
		// console.log(`Passing bars request in. From: ${from}, To: ${to}, Interval: ${urlInterval}`);
		return rp(`${urlBase}/${from}/${to}/${urlInterval}`)
		.then(data => {
			if (data === 'Interval Error') {
				//~ console.log('End of data');
				return []
			}
			if (data.length) {
				var bars = data.map(el => {
					//~ console.log('Time returned: ' + Date.parse(el.timestamp));
					//~ console.log(el);
					return {
						time: Date.parse(el.candle), //TradingView requires bar time in ms
						low: el.low * 1024,
						high: el.high * 1024,
						open: el.open * 1024,
						close: el.close * 1024,
						volume: parseFloat(el.volume)
					}
				})
				if (first) {
					var lastBar = bars[bars.length - 1]
					history[symbolInfo.name] = {lastBar: lastBar}
				}
				return bars
			} else {
				return []
			}
		})
	}
}
