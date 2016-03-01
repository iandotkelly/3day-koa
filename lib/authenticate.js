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

/**
 * Authenticates a user/password combination
 *
 * @param  {String} username
 * @param  {String} password
 * @return {Promise}
 */
function authenticateUser(username, password) {
	return new Promise((resolve, reject) => {
		// find the user
		User.findOne({ username: username }, '-__v')
			.then(user => {
				// user not known
				if (!user) {
					return resolve(false);
				}
				// validate the password
				user.validatePassword(password)
					.then(isMatch => {
						// password matches
						if (isMatch) {
							return resolve(user);
						}

						// password does not match
						return resolve(false);
					})
					.catch(err => reject(err));
			})
			.catch(err => reject(err));
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
		var user = yield authenticateUser(credentials.name, credentials.pass);
		if (user) {
			this.request.user = user;
			return yield next;
		}
	}

	this.response.status = STATUS_UNAUTHORIZED;
	this.response.body = unauthorizedResponse;
}

module.exports = authenticate;
