/**
 * 3DAY Koa Application
 *
 * Copyright (C) Ian Kelly
 */

'use strict';

const koa = require('koa');
const compress = require('koa-compress');
const routerPub = require('koa-router')();
const routerAuth = require('koa-router')();
const logger = require('koa-logger');
const passport = require('koa-passport');
const config = require('./config');
const port = config.port || 4000;

var app = koa();

// logger
app.use(logger());

// Compress
app.use(compress());

// public routes
app.use(routerPub.routes());
app.use(routerPub.allowedMethods());

// authentication
app.use(passport.initialize());

// authentication block
app.use(function *(next) {
	if (this.req.isAuthenticated) {
		// continue downstream routes and
		// middleware that reqires authentication
		yield next;
	} else {
		this.response.status = 401;
	}
});

// private routes
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
