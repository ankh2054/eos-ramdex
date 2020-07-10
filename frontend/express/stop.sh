#!/bin/bash
DIR=$(pwd)

if [ -f $DIR"/express.pid" ]; then
  pid=`cat $DIR"/express.pid"`
  echo $pid
  kill $pid
  rm -r $DIR"/express.pid"

  echo -ne "Stoping express"

  while true; do
    [ ! -d "/proc/$pid/fd" ] && break
    echo -ne "."
    sleep 1
  done
  echo -ne "\DB Express Stopped.    \n"
fi
