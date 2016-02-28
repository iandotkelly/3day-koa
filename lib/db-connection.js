
/**
 * A shared mongoose db connection
 *
 * Copyright (C) Ian Kelly
 */

'use strict';

const mongoose = require('mongoose');
mongoose.Promise =  global.Promise;

// the configuration file
const config = require('../config');

// connect to the database
mongoose.connect(config.database);

// export mongoose
module.exports = mongoose;

// TODO: something slightly better than this?!?
mongoose.connection.on('error', function (err) {
    console.log(err);
});
