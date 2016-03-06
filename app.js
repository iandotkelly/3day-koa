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
const utilities = require('./lib/context-utilities');
const httpStatus = require('http-status');
const port = config.port || 4000;

var app = koa();

// standard middleware
app.use(logger());
app.use(bodyParser());
app.use(compress());

// custom context utility functions
app.use(utilities);

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

/**
 * Authenticated Routes
 */

// users
routerAuth.get('/api/users', routes.users.retrieve);
routerAuth.post('/api/users', routes.users.update);
// Following
routerAuth.get('/api/following', routes.following.retrieve);
routerAuth.post('/api/following/:username', routes.following.create);
routerAuth.delete('/api/following/:id', routes.following.remove);
// followers
routerAuth.get('/api/followers', routes.followers.retrieve);
routerAuth.post('/api/followers/:id', routes.followers.update);
// reports
routerAuth.post('/api/reports', routes.reports.create);
routerAuth.get('/api/reports/:skip/:number', routes.reports.retrieve);
routerAuth.get('/api/reports/:number', routes.reports.retrieve);
routerAuth.get('/api/reports', routes.reports.retrieve);
routerAuth.delete('/api/reports/:id', routes.reports.remove);
routerAuth.post('/api/reports/:id', routes.reports.update);
// report timeline
routerAuth.post('/api/timeline', routes.timeline.bypage);
routerAuth.post('/api/timeline/:time/:number', routes.timeline.bypage);
routerAuth.post('/api/timeline/from/:timefrom/to/:timeto', routes.timeline.bytime);
// images
routerAuth.get('/api/image/:id', routes.images.retrieve);
routerAuth.post('/api/image', routes.images.create);
routerAuth.delete('/api/image/:id', routes.images.remove);

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
