/**
 * 3DAY Koa Application
 *
 * Copyright (C) Ian Kelly
 */

'use strict';

const koa = require('koa');
const compress = require('koa-compress');
const routerAuth = require('koa-router')();
const logger = require('koa-logger');
const config = require('./config');
const routes = require('./routes');
const authenticate = require('./lib/authenticate');
const port = config.port || 4000;

var app = koa();

// logger
app.use(logger());

// Compress
app.use(compress());

// authentication
app.use(require('./lib/customheader-middleware'));
app.use(require('./lib/authenticate'));

// private routes
routerAuth.get('/api/users', routes.users.retrieve);
app.use(routerAuth.routes());
app.use(routerAuth.allowedMethods());

// turn on server
var server = app.listen(port);

// export the app and the server - mostly
// required for testing
module.exports = {
	server: server,
	app: app
};
