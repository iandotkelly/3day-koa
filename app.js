/**
 * 3DAY Koa Application
 *
 * Copyright (C) Ian Kelly
 */

'use strict';

const koa = require('koa');
const compress = require('koa-compress');
const bodyParser = require('koa-bodyparser');
const routerAuth = require('koa-router')();
const routerPub = require('koa-router')();
const logger = require('koa-logger');
const config = require('./config');
const routes = require('./routes');
const authenticate = require('./lib/authenticate');
const port = config.port || 4000;

var app = koa();

// standard middleware
app.use(logger());
app.use(bodyParser());
app.use(compress());

// Public routes
routerPub.post('/api/users', function *(next) {
	// if there is an authorization header then
	// this is an update request, so yield to downstream
	if (this.request.headers.authorization) {
		yield next;
	} else {
		// if not this is a request to create a user
		yield routes.users.create;
	}
});

app.use(routerPub.routes());
app.use(routerPub.allowedMethods());

// authentication
app.use(require('./lib/customheader-middleware'));
app.use(require('./lib/authenticate'));

// private routes
routerAuth.get('/api/users', routes.users.retrieve);
routerAuth.post('/api/users', routes.users.update);
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
