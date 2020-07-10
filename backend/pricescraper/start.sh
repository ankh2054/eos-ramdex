#!/bin/bash
NODE_ENV=production

./stop.sh
echo -e "Starting Pricescraper \n";

NODE_ENV=$NODE_ENV node $(pwd)/server.js &> $(pwd)/logs/$(date +%Y-%m-%d_%H-%M-%S.log) & echo $! > pricescraper.pid
