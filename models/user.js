//
// @description Model for User
//
// @author Ian Kelly
// @copyright Copyright (C) Ian Kelly
//

'use strict';

// db connection
const db = require('../lib/db-connection');

// bcrypt used to store password hashes
const bcrypt = require('bcrypt');
// id utilities
const indexOfId = require('../lib/ids').indexOf;
const listOfIds = require('../lib/ids').listOf;

// the user model itself
var User;

// constants
const reasonCodes = require('../lib/constants').reasonCodes;
// work factor for password encryption
const SALT_WORK_FACTOR = 10;
const usernameValidation = /^[a-zA-Z0-9_-]{4,20}$/;
const passwordValidation = /^[^\s]{6,20}$/;

// spoof a mongoose validation error for the password validation
const passwordValidationError = new Error();
passwordValidationError.name = 'ValidationError';
passwordValidationError.errors = {
	password: {
		message: '15002'
	}
};

const userSchema = db.Schema({
	// the compulsory authentication fields
	username: {
		type: String,
		required: true,
		unique: true
	},
	password: {
		type: String,
		required: true
	},
	// the last updated field - defaults to January 1, 1970
	latest: {
		type: Date,
		default: new Date(0)
	},
	// followers
	followers: [{
		id: {
			type: db.Schema.Types.ObjectId,
			required: true
		},
		status: {
			active: {
				type: Boolean,
				required: true,
				default: true
			},
			approved: {
				type: Boolean,
				required: true,
				default: true
			},
			blocked: {
				type: Boolean,
				required: true,
				default: false
			}
		}
	}],
	// following
	following: [{
		id: {
			type: db.Schema.Types.ObjectId,
			required: true
		}
	}],
	// whether to auto-approve followers
	autoApprove: {
		type: Boolean,
		default: true
	},
	// default created / updated
	created: {
		type: Date,
		default: Date.now
	},
	updated: {
		type: Date,
		default: Date.now
	}
});

/**
* Compares a password
*
* @param   {String}   password The candidate password
* @returns {Promise}
*/
userSchema.methods.validatePassword = function (password) {
	return new Promise((resolve, reject) => {
		bcrypt.compare(password, this.password, function (err, isMatch) {
			if (err) {
				return reject(err);
			}
			resolve(isMatch);
		});
	});
};

/**
* Sets the latest change to the user's data
*
* @returns {Promise}
*/
userSchema.methods.setLatest = function () {

	// set the object's latest to now
	const now = Date.now();
	this.latest = now;

	return new Promise((resolve, reject) => {
		// do an update rather than a full save
		this
			.update({ latest: now })
			.then(results => {
				if (results.nModified !== 1) {
					return reject(new Error(`Unexpected number of affected records ${results.nModified}`));
				}
				resolve(results);
			})
			.catch((err) => { reject(err); });
	});
};

/**
* Add a follower
*
* @param   {Object}   user The user to add as a follower
* @returns {Promise}
*/
userSchema.methods.addFollower = function (user) {

	this.followers = this.followers || [];

	for (var follower of this.followers) {
		if (follower.id === user._id) {
			// return - do nothing
			return new Promise();
		}
	}

	this.followers.push({
		id: user._id,
		status: {
			active: true,
			approved: this.autoApprove,
			blocked: false
		}
	});

	return this.save();
};

/**
* Remove a follower - i.e. mark as inactive
*
* @param   {Object}   id The user to mark as inactive
* @returns {Promise}
*/
userSchema.methods.removeFollower = function (id) {

	// get the index of the follower
	var index = indexOfId(this.followers, id);

	// if we don't find them, then just return
	if (index < 0) {
		return new Promise();
	}

	// otherwise set active state to false and save
	this.followers[index].status.active = false;
	return this.save();
};

/**
* Add a following by user-id
*
* @param {String}    other      The username of the new person to follow
* @param {Object}    status     The status flags of the user
* @returns {Promise} next
*/
userSchema.methods.addFollowing = function (username) {

	return new Promise((resolve, reject) => {
		if (typeof username !== 'string') {
			return reject(new Error('username should be a string'));
		}

		User
			.findOne({ username: username })
			.then(user => {
				// find the user
				if (!user) {
					const err = new Error(`username: ${username} not found`);
					err.name = 'NotFound';
					return reject(err);
				}

				// only add the user if its not there already
				if (indexOfId(this.following, user._id) >= 0) {
					return resolve(user);
				}

				user.addFollower(this)
					.then(() => {
						this.following.push({ id: user._id });
					  return this.save();
					})
					.then(() => resolve(user))
					.catch(err => reject(err));
			})
			.catch(err => reject(err));
	});
};

/**
* Delete following by user-id
*
* @param   {String}  other The username of the friend
* @returns {Promise}
*/
userSchema.methods.removeFollowing = function (id) {

	var following = this.following;
	var index = indexOfId(following, id);

	return new Promise((resolve, reject) => {

		if (index < 0) {
			const err = new Error(`ID: ${id} was not being followed`);
			err.name = 'NotFollowing';
			return reject(err);
		}

		following.splice(index, 1);

		// save the user
		this.save()
			// then find the following reference
			.then(() => User.findById(id, 'followers'))
			// then remove from following
			.then(following => {
				if (!following) {
					const err = new Error(`ID: ${id} not known`);
					err.name = 'NotKnown';
					return reject(err);
				}
				return following.removeFollower(this._id);
			})
			.then(() => resolve())
			.catch(err => reject(err));
	});
};

/**
* Whether this user is approved to access a resource of
* another user
*
* @param   {user}   otherUserId The ObjectId of the other user
* @returns {Promise}
*/
userSchema.methods.isAuthorized = function (otherUserId) {

	return new Promise((resolve, reject) => {

		// by definition we are authorized to view our own stuff
		if (this._id.equals(otherUserId)) {
			return resolve(true);
		}

		User.findById(otherUserId, 'followers')
			.then(otherUser => {

				// is this user even known?
				if (!otherUser) {
					return resolve(false);
				}

				const followers =  otherUser.followers || [];

				// find the index of this user, in the other user's following list
				const index = indexOfId(followers, this._id);

				// i'm not even a follower of this user
				if (index === -1) {
					return resolve(false);
				}

				const status = followers[index].status;

				// we are only authorized when the user is active, approved and not blocked
				return resolve(status.active && status.approved && !status.blocked);
			})
			.catch(err => reject(err));
		});
};

/**
* Returns an array of IDs of users I am authorized to follow
*
* @param   {Array}	shortList	Optional list of IDs
* @returns {Promise}
*/
userSchema.methods.allAuthorized = function (shortList) {

	var ourId = this._id;

	// get list of IDs of users we are following
	var followingIds = listOfIds(this.following, {
		shortList: shortList
	});

	return new Promise((resolve, reject) => {
		User.find({
			'_id': {
				$in: followingIds
			},
			'followers.id': this._id,
			'followers.status.approved': true,
			'followers.status.blocked': false
		},'_id')
			.then(docs => {
				var foundIds = listOfIds(docs, {idName: '_id'});

				// if there is no shortlist, or if we are on the shortlist
				// then we need to add ourselves to the list
				if (!shortList || shortList.indexOf(ourId.toString()) >= 0) {
					foundIds.push(ourId);
				}

				return resolve(foundIds);
			})
			.catch(err => reject(err));
	});
};

/**
* Utility function to add usernames to the following/followers
*
* @param   {Array}    list Array of people following/followers
* @returns {Promise}
* @todo tests
*/
userSchema.statics.addUsername = function (list) {

	var ids = listOfIds(list);

	return new Promise((resolve, reject) => {
		// if we're filtering by the ids, and there are none
		// return an empty list
		if (ids.length === 0) {
			return resolve([]);
		}

		User.find({'_id': { $in: ids } }, '_id username')
			.then(users => {
				// iterate over all the users
				for (var user of users) {
					for (var item of list) {
						if (user._id.equals(item.id)) {
							item.username = user.username;
							break;
						}
					}
				}

				return resolve(list);
			})
			.catch(err => reject(err));
	});
};

/**
* Validation Methods
*/
// Ensure username is adequate length and characters
userSchema.path('username').validate(function (value) {
	return usernameValidation.test(value);
}, reasonCodes.USERNAME_INVALID.toString());

/**
* Perform some pre-save implementation
*/
userSchema.pre('save', function (next) {
	var user = this;

	// refresh the updated property
	user.updated = Date.now();

	if (!user.isModified('password')) {
		return next();
	}

	// validation has to happen here
	if (!passwordValidation.test(user.password)) {
		return next(passwordValidationError);
	}

	bcrypt.genSalt(SALT_WORK_FACTOR, function (err, salt) {
		if (err) {
			return next(err);
		}

		bcrypt.hash(user.password, salt, function (err, hash) {
			if (err) {
				return next(err);
			}
			user.password = hash;
			next();
		});
	});
});

module.exports = User = db.model('User', userSchema);
