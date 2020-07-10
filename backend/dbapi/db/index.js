require("dotenv").config()
const config = process.env;
const moment = require('moment');

//~ Setup DB init options
const initOptionsRead = {
// pg-promise initialization options...
  connect(client, dc, useCount) {
    //~ DEBUG
    //~ const cp = client.connectionParameters;
    //~ console.log('Connected to database:', cp.database);
  },

  disconnect(client, dc) {
    //~ DEBUG
    //~ const cp = client.connectionParameters;
    //~ console.log('Disconnecting from database:', cp.database);
  },

  query(e) {
    //~ DEBUG
    //~ console.log(moment().utc().format('YYYY-MM-DD HH:mm:ss.SSS') + '| Executing: ' + e.query);
  }
};

//~ Setup DB init options
const initOptionsWrite = {
  // pg-promise initialization options...
  connect(client, dc, useCount) {
    //~ DEBUG
    //~ const cp = client.connectionParameters;
    //~ console.log('Connected to database:', cp.database);
  },

  disconnect(client, dc) {
    //~ DEBUG
    //~ const cp = client.connectionParameters;
    //~ console.log('Disconnecting from database:', cp.database);
  },

  query(e) {
    //~ DEBUG
    //~ console.log(moment().utc().format('YYYY-MM-DD HH:mm:ss.SSS') + '| Executing: ' + e.query);
  }
};

const pgpRead = require('pg-promise')(initOptionsRead);
const cnRead = {
  host: config.db_host,
  port: config.db_port,
  database: config.db_database,
  user: config.db_user,
  password: config.db_password
};
pgpRead.pg.types.setTypeParser(1114, str => moment.utc(str).format());
exports.db = pgpRead(cnRead);
