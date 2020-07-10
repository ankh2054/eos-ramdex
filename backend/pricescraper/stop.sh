#!/bin/bash
DIR=$(pwd)

if [ -f $DIR"/pricescraper.pid" ]; then
  pid=`cat $DIR"/pricescraper.pid"`
  echo $pid
  kill $pid
  rm -r $DIR"/pricescraper.pid"

  echo -ne "Stoping Pricescraper"

  while true; do
    [ ! -d "/proc/$pid/fd" ] && break
    echo -ne "."
    sleep 1
  done
  echo -ne "\Pricescraper Stopped.    \n"
fi
