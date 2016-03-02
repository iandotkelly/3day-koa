/**
 * @description Route to handle operations on the /following resource
 *
 * @copyright Copyright (c) Ian Kelly
 */

'use strict';

const httpStatus = require('http-status');
const ObjectId = require('mongoose').Types.ObjectId;
const User = require('../models/user');

/**
 * Add a person you are following
 */
function* create() {

	yield this.request.user.addFollowing(this.params.username)
		.then(user => {
			this.body = { status: 'success', message: 'Friend added', id: user._id };
		})
		.catch(err => {
			if (err && err.name === 'NotFound') {
				this.status = httpStatus.NOT_FOUND;
				this.body = { status: 'failed', message: 'Not found' };
				return;
			}
			this.throw(err);
		});
}

/**
 * Retrieve a list of all the people a user is following
 */
function* retrieve() {

	const user = this.request.user.toObject();

	// add usernames
	yield User.addUsername(user.following || [])
		.then(() => {
			this.body = user.following;
		})
		.catch(err => this.throw(err));

}

/**
 * Remove someone we are following
 */
function* remove() {

	var id;
	try {
		id = new ObjectId(this.params.id);
	} catch (err) {
		// this isn't a valid ID
		this.status = httpStatus.BAD_REQUEST;
		this.body = {	status: 'failed', message: 'Invalid ID format' };
		return;
	}

	yield this.request.user.removeFollowing(id)
		.then(() => {
			this.body = { status: 'success' };
		})
		.catch(err => {
			if (err && (err.name === 'NotFollowing' || err.name === 'NotKnown')) {
				this.status = httpStatus.NOT_FOUND;
				this.body = { status: 'failed', message: 'Not found' };
				return;
			}
			this.throw(err);
		});
}

module.exports = {
	create: create,
	retrieve: retrieve,
	remove: remove
};
