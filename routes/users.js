/**
 * @description Route to handle operations on the /users resource
 *
 * @copyright Copyright (c) Ian Kelly
 */

'use strict';

const User = require('../models').User;
const Report = require('../models').Report;
const httpStatus = require('http-status');
const reasonCodes = require('../lib/constants').reasonCodes;

/**
 * Processes a Save Error
 *
 * @param  {Error} err  An error returned from Mongoose
 * @return {Object}     The message to return by the API, or Undefined if none
 */
function processSaveError(err) {

	// duplicate username
	if (err.code && (err.code === 11000 || err.code === 11001)) {
		return {
			reason: reasonCodes.USERNAME_NOT_UNIQUE,
			message: 'Username not unique'
		};
	}

	// its a schema validation message
	if (err.name && err.name === 'ValidationError') {
		// if it relates to the username
		if (err.errors && err.errors.username) {
			return {
				reason: reasonCodes.USERNAME_INVALID,
				message: 'Username does not meet minimum standards'
			};
		}
		// if it relates to the password
		if (err.errors && err.errors.password) {
			return {
				reason: reasonCodes.PASSWORD_INVALID,
				message: 'Password does not meet minimum standards'
			};
		}
	}
	// else we will return falsey
}

/**
 * Route for POST /api/users - Not Authenticated
 */
function* create(next) {

	const req = this.request;
	const body = req.body;

	// do we have the appropriate parameters?
	if (!body || !body.username || !body.password) {
		return this.send(httpStatus.BAD_REQUEST, {
			reason: reasonCodes.BAD_SYNTAX,
			message: 'Bad request'
		});
	}

	const user = new User({
		username: body.username,
		password: body.password
	});

	yield user.save()
		.then(() => this.send(httpStatus.CREATED, { message: 'Created' }))
		.catch(err => {
			// if its a known validation error then return a bad request
			const saveError = processSaveError(err);
			if (saveError) {
				return this.send(httpStatus.BAD_REQUEST, saveError);
			}
			return this.throw(err, 500);
		});
}


/**
 * Route for GET /api/users - returns the current user's profile
 */
function* retrieve(next) {

	const reqUser = this.state.user;

	// if we have got to this point we already have our user
	// but we will reformat slightly rather than refetch as a lean
	// object from the db
	const user = {
		id: reqUser._id,
		username: reqUser.username,
		autoApprove: reqUser.autoApprove
	};

	// retrieve report count
	user.reportCount = yield Report.count({ userid: user.id });

	this.body = user;
}


function* update(next) {

	const body = this.request.body;
	const user = this.state.user;

	// the update needs to have either an updated username
	// or an updated password
	if (!body || (!body.username && !body.password && !body.followers && !body.hasOwnProperty('autoApprove'))) {
		return this.send(httpStatus.BAD_REQUEST, {
			reason: reasonCodes.BAD_SYNTAX,
			message: 'Bad request'
		});
	}

	if (body.username) {
		user.username = body.username;
	}

	if (body.password) {
		user.password = body.password;
	}

	if (body.followers) {
		user.followers = body.followers;
	}

	if (body.hasOwnProperty('autoApprove')) {
		user.autoApprove = body.autoApprove;
	}

	yield user.save()
		.then(() => {
			this.response.status = httpStatus.OK;
			this.response.body = { message: 'Updated' };
		})
		.catch(err => {
			// if its a known validation error then return a
			// a bad request
			const saveError = processSaveError(err);
			if (saveError) {
				return this.send(httpStatus.BAD_REQUEST, saveError);
			}

			// ok - this is a genuine exception - return a 500
			return this.throw(err);
		});
}

/**
 * If unauthenticated allow a create, otherwise
 * yield to the downstream middleware
 *
 * @param  {Function} next Downstream
 */
function* createOrUpdate(next) {
 // if there is an authorization header then
 // this is an update request, so yield to downstream
 if (this.request.headers.authorization) {
	 yield next;
 } else {
	 // if not this is a request to create a user
	 yield create;
 }
}

module.exports = {
	createOrUpdate: createOrUpdate,
	create: create,
	retrieve: retrieve,
	update: update
};
