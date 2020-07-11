#!/bin/sh
export NODE_ENV=production
export PGUSER=postgres
export PGPASSWORD=${PG_PASSWORD}


postgresql_install() {

# Initialise postgreSQL - 
# Check if exsting DB exists
if [ ! -d "$PG_DATA" ]; then

  chown postgres:postgres /var/lib/postgresql
  sudo -u postgres echo "${PG_PASSWORD}" > ${PG_PASSWORD_FILE}
  chmod 600 ${PG_PASSWORD_FILE} && chown postgres:postgres ${PG_PASSWORD_FILE} && \
  

  sudo -u postgres ${PG_BINDIR}/initdb --pgdata=${PG_DATA} --pwfile=${PG_PASSWORD_FILE} \
    --username=postgres --encoding=UTF8 --auth=trust
else
  echo "DB already exists"
fi
}

env_setup() {
cd /app

# Add DB API database settings
sed -i "s/waxdbuser/$DB_DATABASE/" dbapi/.env && \
sed -i "s/waxramuser/$DB_USER/" dbapi/.env && \
sed -i "s/waxuserpassword/$DB_PASSWORD/" dbapi/.env
}


ram_db_setup(){
psql -U $PGUSER <<- EOSQL
      CREATE DATABASE ${DB_DATABASE};
      CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
      CREATE SCHEMA wax;
      
      CREATE TABLE wax.candles10s (
      timestamp   TIMESTAMP without time zone NOT NULL UNIQUE,
      open        DOUBLE PRECISION  NOT NULL,
      high        DOUBLE PRECISION  NOT NULL,
      low         DOUBLE PRECISION  NOT NULL,
      close       DOUBLE PRECISION  NOT NULL,
      volume      DOUBLE PRECISION  NOT NULL
      );
      CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${DB_PASSWORD}';
      GRANT ALL PRIVILEGES ON DATABASE ${DB_DATABASE} TO ${DB_USER};
      GRANT ALL PRIVILEGES ON SCHEMA wax TO ${DB_USER};
      GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA wax TO ${DB_USER};
      GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA wax TO ${DB_USER};
      /* Create the hyper_table timescaleDB using wax.candles10s */
      -- This creates a hypertable that is partitioned by time
      --   using the values in the `timestamp` column.
      SELECT create_hypertable('wax.candles10s', 'timestamp');
EOSQL
}


# ########################
# Creating supervisor file
###########################

create_supervisor_conf() {
  rm -rf /etc/supervisor/supervisord.conf
  cat > /etc/supervisor/supervisord.conf <<EOF
[unix_http_server]
file=/var/run/supervisor.sock   ; 
chmod=0700                       ; 
[supervisord]
logfile=/var/log/supervisord.log ; 
pidfile=/var/run/supervisord.pid ; 
childlogdir=/var/log/           ; 
[rpcinterface:supervisor]
supervisor.rpcinterface_factory = supervisor.rpcinterface:make_main_rpcinterface
[supervisorctl]
serverurl=unix:///var/run/supervisor.sock ; 
[program:nginx]
command=/usr/sbin/nginx
autorestart=true
autostart=true
[program:postgresql]
command=${PG_BINDIR}/postgres -D ${PG_DATA} -c config_file=${PG_CONFIG_FILE}
directory=${PG_BINDIR}
priority=1
autostart=true
autorestart=true
numprocs=1
user=postgres
[program:dbapi]
command=bash -c 'sleep 10 && node server.js &> logs/dbapi.log' 
directory=/app/dbapi
priority=2
autostart=true
autorestart=true
numprocs=1
[program:pricescraper]
command=bash -c 'sleep 15 && node server.js &> logs/pricescraper.log'
directory=/app/pricescraper
priority=3
autostart=true
autorestart=true
numprocs=1
[program:frontend]
command=bash -c 'sleep 20 && node server.js &> logs/frontend.log'
directory=/app/express
priority=4
autostart=true
autorestart=true
numprocs=1
EOF
}



# Running all our scripts
env_setup
create_supervisor_conf
postgresql_install



# Start Supervisor 
echo "Starting Supervisor"
/usr/bin/supervisord -n -c /etc/supervisor/supervisord.conf

ram_db_setup

