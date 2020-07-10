/*******************************
* Copyright 2018 Andrew Coutts
********************************/
import historyProvider from './historyProvider'
import stream from './stream'

//const supportedResolutions = ["1S", "5S", "10S", "15S", "30S", "1", "2", "3", "5", "10", "15", "30", "45", "60", "120", "180", "240", "720", "D", "W", """M"]
//~ Will add Week/Month support soon
const supportedResolutions = ["1S", "5S", "10S", "15S", "30S", "1", "2", "3", "5", "10", "15", "30", "45", "60", "120", "180", "240", "480", "720", "D", "3D", "W", "2W", "M"]

const config = {
    supported_resolutions: supportedResolutions
};

export default {
	onReady: cb => {
	//~ console.log('=====onReady running')
		setTimeout(() => cb(config), 0)

	},
	searchSymbols: (userInput, exchange, symbolType, onResultReadyCallback) => {
		//~ console.log('====Search Symbols running')
	},
	resolveSymbol: (symbolName, onSymbolResolvedCallback, onResolveErrorCallback) => {
		// expects a symbolInfo object in response
		//~ console.log('======resolveSymbol running')
		// console.log('resolveSymbol:',{symbolName})

		var symbol_stub = {
			name: symbolName,
			description: '',
			type: 'bitcoin',
			session: '24x7',
			timezone: 'UTC',
			ticker: symbolName,
			exchange: '',
			minmov: 1,
			pricescale: 100000000,
			has_intraday: true,
			intraday_multipliers: ['1', '60'],
			supported_resolutions:  supportedResolutions,
      has_no_volume: false,
      has_seconds: true,
      seconds_multipliers: ['1'],
      has_daily: true,
      has_weekly_and_monthly: false,
      supports_time: true,
			data_status: 'streaming',
      volume_precision: 8
		}

		/*if (split_data[2].match(/USD|EUR|JPY|AUD|GBP|KRW|CNY/)) {
			symbol_stub.pricescale = 100
		}*/
		setTimeout(function() {
			onSymbolResolvedCallback(symbol_stub)
			//~ console.log('Resolving that symbol....', symbol_stub)
		}, 0)


		// onResolveErrorCallback('Not feeling it today')

	},
	getBars: function(symbolInfo, resolution, from, to, onHistoryCallback, onErrorCallback, firstDataRequest) {
		//~ console.log('=====getBars running')
    //~ console.log('=====getBars from: ' + from);
    //~ console.log('=====getBars to: ' + to);
    //~ console.log('=====getBars resolution: ' + resolution);

		historyProvider.getBarsEos(symbolInfo, resolution, from, to, firstDataRequest)
		.then(bars => {
			if (bars.length) {
				onHistoryCallback(bars, {noData: false})
			} else {
				onHistoryCallback(bars, {noData: true})
			}
		}).catch(err => {
			//~ console.log({err})
			onErrorCallback(err)
		})

	},
	subscribeBars: (symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback) => {
		//~ console.log('=====subscribeBars runnning')
    stream.subscribeBars(symbolInfo, resolution, onRealtimeCallback, subscribeUID, onResetCacheNeededCallback)
	},
	unsubscribeBars: subscriberUID => {
		//~ console.log('=====unsubscribeBars running')
    stream.unsubscribeBars(subscriberUID)
	},
	calculateHistoryDepth: (resolution, resolutionBack, intervalBack) => {
    //~ console.log('=====calculateHistoryDepth running')
    //~ console.log('===calculateHistoryDepth | resolution: ' + resolution);
    //~ console.log('===calculateHistoryDepth | resolutionBack: ' + resolutionBack);
    //~ console.log('===calculateHistoryDepth | intervalBack: ' + intervalBack);
    let _resolutionBack, _intervalBack;

    //~ Force TV to request data in small chunks at a time to load the page faster
    switch (resolution) {
      case '1S': //~ 5 min candles
      case '5S':
      case '10S':
      case '15S':
      case '30S':
      case '1':
        _resolutionBack = 'D';
        _intervalBack = 0.1;
        break;

      case '2':
      case '3':
      case '5':
        _resolutionBack = 'D';
        _intervalBack = 0.5;  //~ Request data 0.1D at a time
        break;

      case '10':
      case '15':
      case '30':
      case '45':
      case '60':
        _resolutionBack = 'D';
        _intervalBack = 7;  //~ Request data 0.5D at a time
        break;

      default:
        _resolutionBack = 'D';
        _intervalBack = 30;  //~ Request data 1D at a time
        break;

    }

    //~ console.log('===calculateHistoryDepth | OVERRIDE: resolutionBack: ' + _resolutionBack);
    //~ console.log('===calculateHistoryDepth | OVERRIDE: intervalBack: ' + _intervalBack);
    return {resolutionBack: _resolutionBack, intervalBack: _intervalBack}
	},
	getMarks: (symbolInfo, startDate, endDate, onDataCallback, resolution) => {
		//optional
		//~ console.log('=====getMarks running')
	},
	getTimeScaleMarks: (symbolInfo, startDate, endDate, onDataCallback, resolution) => {
		//optional
		//~ console.log('=====getTimeScaleMarks running')
	},
	getServerTime: cb => {
		//~ console.log('=====getServerTime running')
    //~ console.log("====================Requesting Server Time");
    stream.getServerTime(cb);
	}
}
