/**
 * @description Sets up the basic authentication strategy of the application
 *
 * @author Ian Kelly
 */

'use strict';

const auth = require('basic-auth');
const User = require('../models').User;
const STATUS_UNAUTHORIZED = require('http-status').UNAUTHORIZED;

const unauthorizedResponse = {
	message: 'Unauthorized'
};

function authenticateUser(username, password, done) {
	// attempt to retrieve and validate the user
	User.findOne(
		{ username: username },
		'-__v',

		function (err, user) {
			// error when finding user
			if (err) {
				return done(err);
			}

			// user not known
			if (!user) {
				return done(null, false);
			}

			// validate the password
			user.validatePassword(password, function (err, isMatch) {

				// error validating password
				if (err) {
					return done(err);
				}

				// password matches
				if (isMatch) {
					return done(null, user);
				}

				// password does not match
				return done(null, false);
			});

		});
}

/**
 * Koa Middleware for Authentication
 *
 * @param  {Function} next Downstream
 */
function* authenticate(next) {

	var credentials = auth(this.req);

	if (credentials) {
		var user = yield new Promise((resolve, reject) => {
			authenticateUser(credentials.name, credentials.pass, function(err, user) {
				if (err) {
					throw err;
				}
				resolve(user);
			});
		});

		if (user) {
			this.request.user = user;
			return yield next;
		}
	}

	this.response.status = STATUS_UNAUTHORIZED;
	this.response.body = unauthorizedResponse;
}

module.exports = authenticate;
