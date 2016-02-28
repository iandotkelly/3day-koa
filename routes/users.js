/**
 * @description Route to handle operations on the /users resource
 *
 * @copyright Copyright (c) Ian Kelly
 */

'use strict';

var User = require('../models').User;
var Report = require('../models').Report;
var httpStatus = require('http-status');
var reasonCodes = require('../lib/constants').reasonCodes;

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
	var user;

	// do we have the appropriate parameters?
	if (!body || !body.username || !body.password) {
		this.status = httpStatus.BAD_REQUEST;
		this.body = {
			reason: reasonCodes.BAD_SYNTAX,
			message: 'Bad request'
		};
		return;
	}

	user = new User({
		username: body.username,
		password: body.password
	});

	try {
		var success = yield new Promise((resolve) => {
			user.save(function (err) {
				if (err) {
					throw err;
				}
				resolve(true);
			});
		});
	} catch (err) {
		// if its a known validation error then return a
		// a bad request
		var saveError = processSaveError(err);
		if (saveError) {
			this.response.status = httpStatus.BAD_REQUEST;
			this.response.body = saveError;
			return;
		}

		return this.throw(err, 500);
	}

	this.status = httpStatus.CREATED;
	this.body = {
		message: 'Created'
	};
}


/**
 * Route for GET /api/users - returns the current user's profile
 */
function* retrieve(next) {

	const req = this.request;
	const reqUser = req.user;

	// if we have got to this point we already have our user
	// but we will reformat slightly rather than refetch as a lean
	// object from the db
	var user = {
		id: reqUser._id,
		username: reqUser.username,
		autoApprove: reqUser.autoApprove
	};

	// retrieve report count
	user.reportCount = yield new Promise((resolve, reject) => {
		Report.count({userid: user.id}, function (err, count) {
			if (err) {
				throw err;
			}

			resolve(count);
		});
	});

	this.body = user;
}


function* update() {
	yield;
}

module.exports = {
	create: create,
	retrieve: retrieve,
	update: update
};
