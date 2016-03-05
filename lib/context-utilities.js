/**
 * Utility functions on the context
 */

'use strict';

const httpStatus = require('http-status');

/**
 * Set the body and optionally status on the context
 * @param  {Number} status The status code
 * @param  {Varies} body   The body of the response
 */
function send(status, body) {

	if (!status) {
		throw new Error('Must set a body in a response');
	}

	if (!body) {
		body = status;
		status = httpStatus.OK;
	}

	this.status = status;
	this.body = body;
}

function* addUtilities(next) {
	this.send = send;
	yield next;
}

module.exports = addUtilities;
