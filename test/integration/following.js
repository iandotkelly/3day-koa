/**
 * @description Test for the /api/following API
 */

'use strict';


var should = require('should');
var ObjectId = require('mongoose').Types.ObjectId;
var request = require('supertest-koa-agent');
var User = require('../../models').User;

var threeday = require('../../app');
var app = threeday.app;
var server = threeday.server;

describe('The following API', function() {

	var user, friend1, friend2;

	before(function(done) {
		// remove any existing users of the same name
		User.remove({
			username: 'friend1'
		}, function(err) {
			if (err) {
				throw err;
			}
			User.remove({
				username: 'friend2'
			}, function(err) {
				if (err) {
					throw err;
				}
				User.remove({
					username: 'friendintegration'
				}, function(err) {
					if (err) {
						throw err;
					}
					// add users
					user = new User({
						username: 'friendintegration',
						password: 'catsss'
					});
					friend1 = new User({
						username: 'friend1',
						password: 'catsss'
					});
					friend2 = new User({
						username: 'friend2',
						password: 'catsss'
					});
					user.following.push({
						id: friend1._id
					});
					friend1.followers.push({
						id: user._id,
						status: {
							approved: true,
							active: true,
							blocked: false
						}
					});
					user.save(function(err) {
						if (err) {
							throw err;
						}
						friend1.save(function(err) {
							if (err) {
								throw err;
							}
							friend2.save(function(err) {
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

	after(function(done) {
		// delete the user
		user.remove(function(err) {
			if (err) {
				throw err;
			}
			friend1.remove(function(err) {
				if (err) {
					throw err;
				}
				friend2.remove(function(err) {
					if (err) {
						throw err;
					}
					server.close();
					done();
				});
			});
		});
	});

	describe('GET /api/following', function() {

		describe('for a user without people they are following', function() {

			it('should return a 200', function(done) {
				request(app)
					.get('/api/following')
					.set('3day-app', 'test')
					.auth('friend1', 'catsss')
					.expect(200, done);
			});

			it('should return an empty array', function(done) {
				request(app)
					.get('/api/following')
					.set('3day-app', 'test')
					.auth('friend1', 'catsss')
					.end(function(err, res) {
						should.not.exist(err);
						res.body.should.be.an.Array();
						res.body.length.should.equal(0);
						done();
					});
			});

		});


		describe('for a user with people following', function() {

			it('should return a 200', function(done) {
				request(app)
					.get('/api/following')
					.set('3day-app', 'test')
					.auth('friendintegration', 'catsss')
					.expect(200, done);
			});

			it('should return the users in an array', function(done) {
				request(app)
					.get('/api/following')
					.set('3day-app', 'test')
					.auth('friendintegration', 'catsss')
					.end(function(err, res) {
						should.not.exist(err);
						res.body.should.be.an.Array();
						res.body.length.should.be.equal(1);
						res.body[0].username.should.be.equal('friend1');
						done();
					});
			});
		});

	});


	describe('POST /api/following/:username', function() {

		describe('with no user', function() {

			it('should return a 404', function(done) {
				request(app)
					.post('/api/following')
					.set('3day-app', 'test')
					.auth('friendintegration', 'catsss')
					.expect(404, done);
			});

		});

		describe('for an unknown user', function() {

			it('should return a 404', function(done) {
				request(app)
					.post('/api/following/nonsense')
					.set('3day-app', 'test')
					.auth('friendintegration', 'catsss')
					.expect(404, done);
			});

			it('should return an error response', function(done) {
				request(app)
					.post('/api/following/nonsense')
					.set('3day-app', 'test')
					.auth('friendintegration', 'catsss')
					.end(function(err, res) {
						should.not.exist(err);
						res.body.should.be.an.Object();
						should.exist(res.body.status);
						res.body.status.should.be.equal('failed');
						done();
					});
			});
		});

		describe('for an known user', function() {

			it('should return a 200', function(done) {
				request(app)
					.post('/api/following/friend2')
					.set('3day-app', 'test')
					.auth('friendintegration', 'catsss')
					.expect(200, done);
			});

			it('should return an success response with the id', function(done) {
				request(app)
					.post('/api/following/friend2')
					.set('3day-app', 'test')
					.auth('friendintegration', 'catsss')
					.end(function(err, res) {
						should.not.exist(err);
						res.body.should.be.an.Object();
						should.exist(res.body.status);
						res.body.status.should.be.equal('success');
						res.body.id.should.be.equal(friend2._id.toString());
						done();
					});
			});

			it('should now have the person following added', function(done) {
				User.findOne({
					username: 'friendintegration'
				}, function(err, user) {
					user.following.should.be.an.Array();
					user.following.length.should.be.equal(2);
					(user.following[0].id.equals(friend1._id)).should.be.true;
					(user.following[1].id.equals(friend2._id)).should.be.true;
					done();
				});
			});
		});
	});

	describe('DELETE /api/following/:id', function() {

		describe('with no user', function() {

			it('should return a 404', function(done) {
				request(app)
					.del('/api/following')
					.set('3day-app', 'test')
					.auth('friendintegration', 'catsss')
					.expect(404, done);
			});
		});

		describe('for an unknown user', function() {

			it('should return a 404', function(done) {
				request(app)
					.del('/api/following/' + new ObjectId())
					.set('3day-app', 'test')
					.auth('friendintegration', 'catsss')
					.expect(404, done);
			});

			it('should return an error response', function(done) {
				request(app)
					.del('/api/following/' + new ObjectId())
					.set('3day-app', 'test')
					.auth('friendintegration', 'catsss')
					.end(function(err, res) {
						should.not.exist(err);
						res.body.should.be.an.Object();
						should.exist(res.body.status);
						res.body.status.should.be.equal('failed');
						done();
					});
			});
		});

		describe('for an known user', function() {

			it('should return an success response', function(done) {
				request(app)
					.del('/api/following/' + friend1._id.toString())
					.set('3day-app', 'test')
					.auth('friendintegration', 'catsss')
					.end(function(err, res) {
						should.not.exist(err);
						res.status.should.be.equal(200);
						res.body.should.be.an.Object();
						res.body.status.should.be.equal('success');
						done();
					});
			});

			it('should now have the friend1 removed', function(done) {
				User.findOne({
					username: 'friendintegration'
				}, function(err, user) {
					should.not.exist(err);
					user.following.should.be.an.Array();
					// should only have friend 2
					user.following.length.should.be.equal(1);
					user.following[0].id.toString().should.be.equal(friend2._id.toString());
					// and we should be marked as non active
					User.findOne({
						username: 'friend1'
					}, function(err, friend) {
						should.not.exist(err);
						friend.followers.length.should.be.equal(1);
						friend.followers[0].id.toString().should.be.equal(user._id.toString());
						friend.followers[0].status.active.should.be.false;
						friend.followers[0].status.blocked.should.be.false;
						friend.followers[0].status.approved.should.be.true;
					});
					done();
				});
			});
		});
	});
});
