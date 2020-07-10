#!/bin/sh



create_dir() {
  # Create LOG directoties for express
  echo "Creating express log directory"
  mkdir -p /logs

}


postgresql_install() {

# Run the timescaleDB tuning to update postgresql conf
timescaledb-tune --quiet --yes

# Initialise postgreSQL - 
# Check if exsting DB exists
if [ ! -d "$PG_DATA" ]; then

  echo "${PG_PASSWORD}" > ${PG_PASSWORD_FILE}
  chmod 600 ${PG_PASSWORD_FILE}

  ${PG_BINDIR}/initdb --pgdata=${PG_DATA} --pwfile=${PG_PASSWORD_FILE} \
    --username=postgres --encoding=UTF8 --auth=trust

  echo "*************************************************************************"
  echo " PostgreSQL password is ${PG_PASSWORD}"
  echo "*************************************************************************"

  # Setting credentials for psql connect
  export PGUSER=postgres
  export PGPASSWORD=${PG_PASSWORD}

    psql --username "$PGUSER" <<- EOSQL
    CREATE DATABASE ${DB_DATABASE};
    CREATE SCHEMA wax;
    
    CREATE TABLE wax.candles10s (
    timestamp   TIMESTAMP without time zone NOT NULL UNIQUE,
    open        DOUBLE PRECISION  NOT NULL,
    high        DOUBLE PRECISION  NOT NULL,
    low         DOUBLE PRECISION  NOT NULL,
    close       DOUBLE PRECISION  NOT NULL,
    volume      DOUBLE PRECISION  NOT NULL
    );
    CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${PG_PASSWORD}';
    GRANT ALL PRIVILEGES ON DATABASE ${DB_DATABASE} TO ${DB_USER};
    GRANT ALL PRIVILEGES ON SCHEMA wax TO ${DB_USER};
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA wax TO ${DB_USER};
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA wax TO ${DB_USER};
    /* Create the hyper_table timescaleDB using wax.candles10s */
    -- This creates a hypertable that is partitioned by time
    --   using the values in the `timestamp` column.
    SELECT create_hypertable('wax.candles10s', 'timestamp');
EOSQL

else
  echo "DB already exists"
fi
}

unset PGPASSWORD
unset PG_PASSWORD

env_setup() {
cd /app

# Add DB API database settings
sed -i "s/db_database/$DB_DATABASE/" dbapi/.env && \
sed -i "s/db_user/$DB_USER/" dbapi/.env && \
sed -i "s/db_password/$DB_PASSWORD/" dbapi/.env

}

# ########################
# Creating supervisor file
###########################

create_supervisor_conf() {
  rm -rf /etc/supervisord.conf
  cat > /etc/supervisord.conf <<EOF
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
command=postgres -D ${PG_DATA} -c config_file=${PG_CONFIG_FILE}
directory=${PG_BINDIR}
autostart=true
autorestart=true
numprocs=1
user=postgres


[program:dbapi]
command=node server.js &> /logs/dbapi.log
directory=/app/dbapi
autostart=true
autorestart=true
numprocs=1

[program:pricescraper]
command=node server.js &> /logs/pricescraper.log
directory=/app/pricescraper
autostart=true
autorestart=true
numprocs=1


[program:frontend]
command=node server.js &> /logs/frontend.log
directory=/app/express
autostart=true
autorestart=true
numprocs=1

EOF
}









# Running all our scripts
create_supervisor_conf
env_setup
postgresql_install
create_dir




# Start Supervisor 
echo "Starting Supervisor"
/usr/bin/supervisord -n -c /etc/supervisord.conf