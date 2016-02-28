/**
 * @description tests for users model
 */

'use strict';

var User = require('../../models').User;
var should = require('should');
var eachSeries = require('async').eachSeries;

describe('User', function() {

	it('should be a function', function() {
		User.should.be.a.

		function;
	});

	it('should construct an object', function() {
		var user = new User({
			username: 'testname'
		});
		user.should.be.an.Object();
		user.username.should.be.equal('testname');
		user._id.should.be.a.string;
	});

	describe('#save() with missing username', function() {

		it('should return an error', function(done) {
			var user = new User({
				password: 'catsss'
			});
			user.save(function(err) {
				err.should.be.an.Object();
				err.name.should.be.equal('ValidationError');
				done();
			});
		});

	});

	describe('#save() with missing password', function() {

		it('should return an error', function(done) {
			var user = new User({
				username: 'testname',
			});
			user.save(function(err) {
				err.should.be.an.Object();
				err.name.should.be.equal('ValidationError');
				done();
			});
		});
	});

	describe('#save() with an invalid username', function() {

		it('should return an error', function(done) {
			var user = new User({
				username: 'hi',
				password: 'ThisIsAGoodOne3!'
			});
			user.save(function(err) {
				err.should.be.an.Object();
				err.name.should.be.equal('ValidationError');
				err.errors.username.message.should.be.equal('15001');
				done();
			});
		});
	});


	describe('#save() with an invalid password', function() {

		it('should return an error', function(done) {
			var user = new User({
				username: 'iandotkelly',
				password: '   '
			});
			user.save(function(err) {
				err.should.be.an.Object();
				err.name.should.be.equal('ValidationError');
				err.errors.password.message.should.be.equal('15002');
				done();
			});
		});
	});

	describe('with good required parameters', function() {

		var user;

		before(function(done) {
			User.remove({
				username: 'testname'
			}, function(err) {
				if (err) {
					throw err;
				}
				user = new User({
					username: 'testname',
					password: 'catsss',
				});
				done();
			});

		});

		after(function(done) {
			user.remove(function(err) {
				if (err) {
					throw err;
				}
				done();
			});
		});

		describe('#save', function() {

			it('should not have an error', function(done) {
				user.save(function(err) {
					should(err).not.Error;
					done();
				});
			});

			it('should have all the properties', function() {
				user.username.should.be.equal('testname');
				user.latest.getTime().should.be.equal(0);
			});

		});

		describe('#validatePassword()', function() {

			it('should not match with the wrong password', function(done) {
				user.validatePassword('dogsss', function(err, isMatch) {
					should(err).not.Error;
					isMatch.should.be.false;
					done();
				});
			});

			it('should match with the correct password', function(done) {
				user.validatePassword('catsss', function(err, isMatch) {
					should(err).not.Error;
					isMatch.should.be.true;
					done();
				});
			});

		});

		describe('#update()', function() {

			it('should change the latest time to something like now', function(done) {

				var diff = Math.abs(Date.now() - user.latest.getTime());
				diff.should.be.greaterThan(100000);

				user.setLatest()
					.then(() => {
						diff = Math.abs(Date.now() - user.latest.getTime());
						diff.should.be.lessThan(100);
						done();
					})
					.catch((err) => {
						throw err;
					});
			});
		});
	});

	describe('#findOne', function() {

		var madeUser;

		before(function(done) {
			madeUser = new User({
				username: 'iandotkelly',
				password: 'genius'
			});
			User.remove({
				username: 'iandotkelly'
			}, function(err) {
				if (err) {
					throw err;
				}
				madeUser.save(function(err) {
					if (err) {
						throw err;
					}
					done();
				});
			});

		});

		after(function() {
			madeUser.remove(function(err) {
				if (err) {
					throw err;
				}
			});
		});

		it('should not find a record with an unknown username', function(done) {
			User.findOne({
				username: 'cats'
			}, function(err, user) {
				should(err).not.Error;
				should(user).not.ok;
				done();
			});
		});

		it('should retrieve a user with a known username', function(done) {
			User.findOne({
				username: 'iandotkelly'
			}, function(err, user) {
				should(err).not.Error;
				user.should.be.a.object;
				user.username.should.equal('iandotkelly');
				done();
			});
		});

	});

	describe('#addFollowing', function() {

		var myuser, friend;

		before(function(done) {

			friend = new User({
				username: 'friend',
				password: 'othergenius'
			});
			myuser = new User({
				username: 'iandotkelly',
				password: 'genius'
			});

			User.remove({
				username: 'iandotkelly'
			}, function(err) {
				if (err) {
					throw err;
				}
				User.remove({
					username: 'friend'
				}, function(err) {
					if (err) {
						throw err;
					}

					myuser.save(function(err) {
						if (err) {
							throw err;
						}
						friend.save(function(err) {
							if (err) {
								throw err;
							}
							done();
						});
					});
				});
			});
		});

		after(function() {
			myuser.remove(function(err) {
				if (err) {
					throw err;
				}
				friend.remove(function(err) {
					if (err) {
						throw err;
					}
				});
			});
		});

		it('should return an error if the user id is not known', function(done) {
			myuser.addFollowing('nonsense', function(err) {
				should(err).be.an.object;
				done();
			});
		});

		it('should add a valid new user', function(done) {
			myuser.following.length.should.be.equal(0);
			myuser.addFollowing('friend', function(err) {
				should.not.exist(err);
				User.findOne({
					username: 'iandotkelly'
				}, function(err, user) {
					// check the following
					should.not.exist(err);
					user.following.length.should.be.equal(1);
					user.following[0].id.toString().should.be.equal(friend._id.toString());
					User.findOne({
						username: 'friend'
					}, function(err, user) {
						// check the follower
						should.not.exist(err);
						user.followers.length.should.be.equal(1);
						var follower = user.followers[0];
						follower.id.toString().should.be.equal(myuser._id.toString());
						follower.status.should.be.an.Object();
						follower.status.approved.should.be.true;
						follower.status.active.should.be.true;
						follower.status.blocked.should.be.false;
						done();
					});
				});
			});
		});
	});

	describe('#removeFollowing', function() {

		var myuser, friend;

		before(function(done) {

			friend = new User({
				username: 'friend',
				password: 'othergenius',
				followers: []
			});

			myuser = new User({
				username: 'iandotkelly',
				password: 'genius',
				followers: [],
				following: [{
					id: friend._id
				}]
			});

			friend.followers.push({
				id: myuser._id,
				status: {
					active: true,
					approved: true,
					blocked: false
				}
			});

			User.remove({
				username: 'iandotkelly'
			}, function(err) {
				if (err) {
					throw err;
				}
				User.remove({
					username: 'friend'
				}, function(err) {
					if (err) {
						throw err;
					}
					myuser.save(function(err) {
						if (err) {
							throw err;
						}
						friend.save(function(err) {
							if (err) {
								throw err;
							}
							done();
						});
					});
				});
			});
		});

		after(function() {
			myuser.remove(function(err) {
				if (err) {
					throw err;
				}
				friend.remove(function(err) {
					if (err) {
						throw err;
					}
				});
			});
		});

		it('should return an error if the username is not known', function(done) {
			myuser.removeFollowing(new User({
				username: 'nonsense',
				password: 'catssss'
			})._id, function(err) {
				err.should.be.an.Object();
				User.findOne({
					username: 'iandotkelly'
				}, function(err, user) {
					should.not.exist(err);
					user.following.length.should.be.equal(1);
					User.findOne({
						username: 'friend'
					}, function(err, user) {
						should.not.exist(err);
						user.followers.length.should.be.equal(1);
						done();
					});
				});
			});
		});

		it('should delete the following', function(done) {
			myuser.removeFollowing(friend._id, function(err) {
				should.not.exist(err);
				User.findOne({
					username: 'iandotkelly'
				}, function(err, user) {
					should.not.exist(err);
					user.following.length.should.be.equal(0);
					User.findOne({
						username: 'friend'
					}, function(err, user) {
						should.not.exist(err);
						user.followers.length.should.be.equal(1);
						user.followers[0].status.active.should.be.false;
						done();
					});
				});
			});
		});
	});

	describe('#isAuthorized', function() {

		var approved, notApproved, blocked, myuser;

		before(function(done) {

			approved = new User({
				username: 'friend',
				password: 'othergenius',
				followers: []
			});

			notApproved = new User({
				username: 'notfriend',
				password: 'othergenius',
				followers: []
			});

			blocked = new User({
				username: 'reallynotfriend',
				password: 'othergenius',
				followers: []
			});

			myuser = new User({
				username: 'iandotkelly',
				password: 'genius',
				followers: [{
					id: approved._id,
					status: {
						active: true,
						approved: true,
						blocked: false
					}
				}, {
					id: notApproved._id,
					status: {
						active: true,
						approved: false,
						blocked: false
					}
				}, {
					id: blocked._id,
					status: {
						active: true,
						approved: false,
						blocked: true
					}
				}],
				following: []
			});

			User.remove({
				username: 'iandotkelly'
			}, function(err) {
				if (err) {
					throw err;
				}
				User.remove({
					username: 'friend'
				}, function(err) {
					if (err) {
						throw err;
					}
					User.remove({
						username: 'notfriend'
					}, function(err) {
						if (err) {
							throw err;
						}
						User.remove({
							username: 'reallynotfriend'
						}, function(err) {
							if (err) {
								throw err;
							}
							myuser.save(function(err) {
								if (err) {
									throw err;
								}
								approved.save(function(err) {
									if (err) {
										throw err;
									}
									notApproved.save(function(err) {
										if (err) {
											throw err;
										}
										blocked.save(function(err) {
											if (err) {
												throw err;
											}
                                            done();
										});
									});
								});
							});
						});
					});
				});
			});
		});

		describe('with an approved user', function() {
			it('should be approved', function(done) {
				approved.isAuthorized(myuser._id, function(err, approved) {
					if (err) {
						throw err;
					}
					approved.should.be.true;
					done();
				});
			});
		});


		describe('with a not approved user', function() {
			it('should be approved', function(done) {
				notApproved.isAuthorized(myuser._id, function(err, approved) {
					if (err) {
						throw err;
					}
					approved.should.be.false;
					done();
				});
			});
		});

		describe('with a blocked user', function() {
			it('should be approved', function(done) {
				blocked.isAuthorized(myuser._id, function(err, approved) {
					if (err) {
						throw err;
					}
					approved.should.be.false;
					done();
				});
			});
		});

	});

	describe('#allAuthorized', function () {

		var user, followingA1, followingA2, followingNA1, followingB1;

		before(function (done) {

			user = new User({username: 'iandotkelly', password: 'catsss'});

			followingA1 = new User({
				username: 'followingA1',
				password: 'catsss',
				followers: [{
					id: user._id,
					status: {
						active: true,
						blocked: false,
						approved: true
					}
				}]
			});

			followingA2 = new User({
				username: 'followingA2',
				password: 'catsss',
				followers: [{
					id: user._id,
					status: {
						active: true,
						blocked: false,
						approved: true
					}
				}]
			});

			followingNA1 = new User({
				username: 'followingNA1',
				password: 'catsss',
				followers: [{
					id: user._id,
					status: {
						active: true,
						blocked: false,
						approved: false
					}
				}]
			});

			followingB1 = new User({
				username: 'followingB1',
				password: 'catsss',
				followers: [{
					id: user._id,
					status: {
						active: true,
						blocked: true,
						approved: true
					}
				}]
			});

			user.following.push({id:followingA1._id},
				{id:followingA2._id},
				{id:followingNA1._id},
				{id:followingB1._id}
			);

			var users = [
				user,
				followingA1,
				followingA2,
				followingNA1,
				followingB1
			];

			eachSeries(users, function(user, cb) {
				User.remove({
					username: user.username
				}, function (err) {
					cb(err);
				});
			}, function (err) {
				if (err) {
					throw err;
				}
				eachSeries(users, function(user, cb) {
					user.save(function (err) {
						cb(err);
					});
				}, function (err) {
					if (err) {
						throw err;
					}
					done();
				});
			});
		});

		after(function (done) {

			var users = [
				user,
				followingA1,
				followingA2,
				followingNA1,
				followingB1
			];

			eachSeries(users, function(user, cb) {
				user.remove(function (err) {
					cb(err);
				});
			}, function (err) {
				if (err) {
					throw err;
				}
				done();
			});
		});

		describe('with no shortlist', function () {

			it('should return 3 approved', function (done) {
				user.allAuthorized(function (err, ids) {
					should.not.exist(err);
					ids.should.be.an.Array();
					ids.length.should.be.equal(3);
					(ids[0].equals(followingA1._id)).should.be.true;
					(ids[1].equals(followingA2._id)).should.be.true;
					(ids[2].equals(user._id)).should.be.true;
					done();
				});
			});
		});


		describe('with a shortlist', function () {

			it('should return 1 approved', function (done) {
				user.allAuthorized([followingA2._id], function (err, ids) {
					should.not.exist(err);
					ids.should.be.an.Array();
					ids.length.should.be.equal(1);
					(ids[0].equals(followingA2._id)).should.be.true;
					done();
				});
			});
		});

		describe('with a shortlist of myself', function () {

			it('should return 1 approved', function (done) {
				user.allAuthorized([user._id.toString()], function (err, ids) {
					should.not.exist(err);
					ids.should.be.an.Array();
					ids.length.should.be.equal(1);
					(ids[0].equals(user._id)).should.be.true;
					done();
				});
			});
		});
	});
});
