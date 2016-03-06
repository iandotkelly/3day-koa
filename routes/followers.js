/**
 * @description Route to handle operations on the /followers resource
 *
 * @copyright Copyright (c) Ian Kelly
 */

'use strict';

const httpStatus = require('http-status');
const ObjectId = require('mongoose').Types.ObjectId;
const User = require('../models/user');

/**
 * Retrieve a list of all the followers of a user
 */
function* retrieve() {

	const followers = this.request.user.toObject().followers || [];
	const active = [];

	// only copy active users
	for (var follower of followers) {
		if (follower.status.active) {
			active.push({
				id: follower.id,
				status: {
					approved: follower.status.approved,
					blocked: follower.status.blocked
				}
			});
		}
	}

	this.body = yield User.addUsername(active);
}

/**
 * Update a particular followers details
 */
function* update() {
  // jshint maxstatements: 18, strict: true

  var id = this.params.id;
	const user = this.request.user,
		followers = user.followers,
		approved = this.request.body.approved,
		blocked = this.request.body.blocked;

  try {
    id = new ObjectId(id);
  } catch (err) {
		return this.send(httpStatus.BAD_REQUEST, {
			status: 'failed',
			message: 'not a user id'
		});
  }

	if (typeof approved !== 'boolean' && typeof blocked !== 'boolean') {
		return this.send(httpStatus.BAD_REQUEST, {
			status: 'failed',
			message: 'no data included'
		});
  }

  // find the relevent user
  var found;
	for (var follower of followers) {
    if (follower.id.equals(id)) {
      found = follower;
      break;
    }
  }

  if (!found) {
		return this.send(httpStatus.BAD_REQUEST, {
			status: 'failed',
			message: `not following user $(id.toString())`
		});
  }

	found.status.approved = approved === undefined ?
		found.status.approved : approved;
	found.status.blocked = blocked === undefined ?
		found.status.blocked : blocked;

	yield user.save();

	this.send({ status: 'success', message: 'follower status updated' });
}

module.exports = {
  retrieve: retrieve,
  update: update
};
