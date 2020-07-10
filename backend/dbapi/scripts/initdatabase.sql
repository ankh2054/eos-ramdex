/*  Extend the database with TimescaleDB */
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;

CREATE SCHEMA wax
/* Create the table called candles10s inside the wax schema - syntax: CREATE TABLE myschema.mytable */
CREATE TABLE wax.candles10s (
  timestamp   TIMESTAMP without time zone NOT NULL UNIQUE,
  open        DOUBLE PRECISION  NOT NULL,
  high        DOUBLE PRECISION  NOT NULL,
  low         DOUBLE PRECISION  NOT NULL,
  close       DOUBLE PRECISION  NOT NULL,
  volume      DOUBLE PRECISION  NOT NULL
);

CREATE USER waxramuser WITH ENCRYPTED PASSWORD 'password';
GRANT ALL PRIVILEGES ON DATABASE waxram TO waxramuser;
GRANT ALL PRIVILEGES ON SCHEMA wax TO waxramuser;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA wax TO waxramuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA wax TO waxramuser;
/* Create the hyper_table timescaleDB using wax.candles10s */
-- This creates a hypertable that is partitioned by time
--   using the values in the `timestamp` column.
SELECT create_hypertable('wax.candles10s', 'timestamp');