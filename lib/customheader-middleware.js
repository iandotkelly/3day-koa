/**
 * @description Middleware handler for the 3day-app header
 */

'use strict';

const accepts = require('accepts');
const STATUS_UNAUTHORIZED = require('http-status').UNAUTHORIZED;

/**
 * Middleware function to intercept and respond to the
 * 3day-app header
 *
 * @param  {Function} next Yieldable next middleware
 */
function* middleware(next) {

	const req = this.request;
	const expectedHeader = req.headers['3day-app'];

	// quick and dirty hack to stop it blocking browsers
	const clientAccepts = accepts(req);
	const acceptsJsonButNotHtml = clientAccepts.types('json') === 'json' && !clientAccepts.types('html');

	// currrently we're not logging the contained value
	// just returning non authorized
	if (acceptsJsonButNotHtml && !expectedHeader) {
		return this.response.send(STATUS_UNAUTHORIZED);
	}

	yield next;
}

module.exports = middleware;
