/*******************************
* Copyright 2018 Andrew Coutts
********************************/
import React, { useState, useEffect } from 'react';
import './index.css';
import Datafeed from './api/'



function getLanguageFromURL() {
	const regex = new RegExp('[\\?&]lang=([^&#]*)');
	const results = regex.exec(window.location.search);
	return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
}



const TVChart = (props) => {

	const { autosize = true, symbol = 'WAX/KB RAM | SENTNL | waxram.sentnl.io', interval = '60', containerId = 'tv_chart_container', clientId = 'tradingview.com', libraryPath = '/chart/', chartsStorageUrl
		, chartsStorageApiVersion = '1.1', userId = 'ankh2054', fullscreen = false, studiesOverrides = {
			"volume.volume.color.0": "#ec4d5c",	//~ Down color
			"volume.volume.color.1": "#52b986"	//~ Up color
		} } = props;


	

	useEffect(()=>{
		const widgetOptions = {
			debug: false,
			theme: "Light",
			symbol: symbol,
			datafeed: Datafeed,
			interval: interval,
			container_id: containerId,
			library_path: libraryPath,
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
			charts_storage_url: chartsStorageUrl,
			charts_storage_api_version: chartsStorageApiVersion,
			client_id: clientId,
			user_id: userId,
			fullscreen: fullscreen,
			autosize: autosize,
			studies_overrides: studiesOverrides,
			overrides: {
				"mainSeriesProperties.showCountdown": true
			}
		};
		window.TradingView.onready(() => {
			const widget = window.tvWidget = new window.TradingView.widget(widgetOptions);
			widget.onChartReady(() => {
				console.log('Chart has loaded!')
			});
		});
	});
	

	return (
		<div
			id={ containerId }
			className={'TVChart'}
		/>
	);

}





export default TVChart;
