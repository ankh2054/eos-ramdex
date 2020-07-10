#!/bin/bash
DIR=$(pwd)

if [ -f $DIR"/dbapi.pid" ]; then
  pid=`cat $DIR"/dbapi.pid"`
  echo $pid
  kill $pid
  rm -r $DIR"/dbapi.pid"

  echo -ne "Stoping dbapi"

  while true; do
    [ ! -d "/proc/$pid/fd" ] && break
    echo -ne "."
    sleep 1
  done
  echo -ne "\DB API Stopped.    \n"
fi
