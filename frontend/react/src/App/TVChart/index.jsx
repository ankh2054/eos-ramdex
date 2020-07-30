/*******************************
* Copyright 2018 Andrew Coutts
********************************/
import * as React from 'react';
import './index.css';
import Datafeed from './api/'


function getLanguageFromURL() {
	const regex = new RegExp('[\\?&]lang=([^&#]*)');
	const results = regex.exec(window.location.search);
	return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
}

class TVChart extends React.PureComponent {

	static defaultProps = {
		//symbol: 'Coinbase:BTC/USD',
		symbol: 'WAX/KB RAM | SENTNL | waxram.io',
		interval: '60',
		containerId: 'tv_chart_container',
		libraryPath: '/chart/',
		//~ chartsStorageUrl: 'https://saveload.tradingview.com',
		chartsStorageApiVersion: '1.1',
		clientId: 'tradingview.com',
		userId: 'ankh2054',
		fullscreen: false,
		autosize: true,
		studiesOverrides: {
			"volume.volume.color.0": "#ec4d5c",	//~ Down color
			"volume.volume.color.1": "#52b986"	//~ Up color
		},
		loading_screen: { backgroundColor: '#000000e6' }
	};

	componentDidMount() {
		const widgetOptions = {
			debug: false,
			theme: "Dark",
			symbol: this.props.symbol,
			datafeed: Datafeed,
			interval: this.props.interval,
			container_id: this.props.containerId,
			library_path: this.props.libraryPath,
			locale: getLanguageFromURL() || 'en',
			disabled_features: [
				'header_symbol_search',
				'study_templates',
				'compare_symbol',
				'header_compare',
				'show_hide_button_in_legend'
			],
			enabled_features: [
				'use_localstorage_for_settings',
				'display_market_status',
				'seconds_resolution',
				'side_toolbar_in_fullscreen_mode',
				'study_buttons_in_legend',
				'move_logo_to_main_pane'
			],
			charts_storage_url: this.props.chartsStorageUrl,
			charts_storage_api_version: this.props.chartsStorageApiVersion,
			client_id: this.props.clientId,
			user_id: this.props.userId,
			fullscreen: this.props.fullscreen,
			autosize: this.props.autosize,
			studies_overrides: this.props.studiesOverrides,
			overrides: {
				"mainSeriesProperties.showCountdown": true
			}
		};

		window.TradingView.onready(() => {
			const widget = window.tvWidget = new window.TradingView.widget(widgetOptions);
			widget.onChartReady(() => {
				//~ console.log('Chart has loaded!')
			});
		});
	}

	render() {
		return (
			<div
				id={ this.props.containerId }
				className={ 'TVChart' }
			/>
		);
	}
}


export default TVChart;
