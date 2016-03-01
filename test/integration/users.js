/**
 * @description Test for the /api/users API
 *
 * @author Ian Kelly
 */

'use strict';

var request = require('supertest-koa-agent');
var should = require('should');

var User = require('../../models').User;
var Report = require('../../models').Report;

var threeday = require('../../app');
var app = threeday.app;
var server = threeday.server;

describe('POST /api/users', function () {

	after(function(done) {
		server.close();
		done();
	});

	describe('with no authorization header', function () {

		describe('with no body', function () {

			it('should return a 400', function (done) {
				request(app)
					.post('/api/users')
					.set('3day-app', 'test')
					.expect(400, done);
			});

			it('should return the expected error body', function (done) {
				request(app)
					.post('/api/users')
					.set('3day-app', 'test')
					.end(function (err, res) {
						should.not.exist(err);
						res.body.should.be.an.Object();
						should.exist(res.body.message);
						res.body.message.should.be.equal('Bad request');
						done();
					});
			});
		});

		describe('With no username', function () {

			it('should return a 400', function (done) {
				request(app)
					.post('/api/users')
					.set('3day-app', 'test')
					.send({password: 'catsss'})
					.expect(400, done);
			});

			it('should return contain the expected error body', function (done) {
				request(app)
					.post('/api/users')
					.set('3day-app', 'test')
					.send({password: 'catsss'})
					.end(function (err, res) {
						should.not.exist(err);
						res.body.should.be.an.Object();
						should.exist(res.body.message);
						res.body.message.should.be.equal('Bad request');
						res.body.reason.should.be.equal(10000);
						done();
					});
			});
		});


		describe('with no password', function () {

			it('should return a 400', function (done) {
				request(app)
					.post('/api/users')
					.set('3day-app', 'test')
					.send({username: 'iandotkelly'})
					.expect(400, done);
			});

			it('should return the expected error body', function (done) {
				request(app)
					.post('/api/users')
					.set('3day-app', 'test')
					.send({username: 'iandotkelly'})
					.end(function (err, res) {
						should.not.exist(err);
						res.body.should.be.an.Object();
						should.exist(res.body.message);
						res.body.message.should.be.equal('Bad request');
						res.body.reason.should.be.equal(10000);
						done();
					});
			});
		});



		describe('with bad username', function () {

			it('should return a 400', function (done) {
				request(app)
					.post('/api/users')
					.set('3day-app', 'test')
					.send({username: 'ian', password: 'isGoodenough123!' })
					.expect(400, done);
			});

			it('should return contain the expected error body', function (done) {
				request(app)
					.post('/api/users')
					.set('3day-app', 'test')
					.send({username: 'ian', password: 'isGoodenough123!'})
					.end(function (err, res) {
						should.not.exist(err);
						res.body.should.be.an.Object();
						should.exist(res.body.message);
						res.body.message.should.be.equal('Username does not meet minimum standards');
						res.body.reason.should.be.equal(15001);
						done();
					});
			});
		});

		describe('With bad password', function () {

			it('should return a 400', function (done) {
				request(app)
					.post('/api/users')
					.set('3day-app', 'test')
					.send({username: 'iandotkelly', password: '   ' })
					.expect(400, done);
			});

			it('should return contain the expected error body', function (done) {
				request(app)
					.post('/api/users')
					.set('3day-app', 'test')
					.send({username: 'iandotkelly', password: '   ' })
					.end(function (err, res) {
						should.not.exist(err);
						res.body.should.be.an.Object();
						should.exist(res.body.message);
						res.body.message.should.be.equal('Password does not meet minimum standards');
						res.body.reason.should.be.equal(15002);
						done();
					});
			});
		});

		describe('With both username and password', function () {

			// make sure no pre-existing user is there
			beforeEach(function (done) {
				User.remove({username: 'integrationtest'}).then(() => done());
			});

			// remove user after each test
			afterEach(function (done) {
				User.remove({username: 'integrationtest'}).then(() => done());
			});

			it('should return a 201', function (done) {
				request(app)
					.post('/api/users')
					.set('3day-app', 'test')
					.send({username: 'integrationtest', password: 'catsss'})
					.expect(201, done);
			});

			it('should create the user', function (done) {
				request(app)
					.post('/api/users')
					.set('3day-app', 'test')
					.send({username: 'integrationtest', password: 'catsss'})
					.end(function (err, res) {
						should.not.exist(err);
						res.body.should.be.an.Object();
						should.exist(res.body.message);
						res.body.message.should.equal('Created');
						User.findOne({username: 'integrationtest'}, function (err, user) {
							should.not.exist(err);
							user.username.should.equal('integrationtest');
							user.latest.getTime().should.equal(0);
							user.validatePassword('catsss')
								.then((isMatch) => {
									isMatch.should.be.true();
									done();
								})
								.catch(err => done(err));
						});
					});
			});
		});


		describe('where a user of the same name exists', function () {

			// ensure a pre-existing user exists
			beforeEach(function (done) {
				User.remove({username: 'preexisting'}, function () {
					var user = new User({username: 'preexisting', password: 'catsss'});
					user.save(function (err) {
						if (err) {
							throw err;
						}
						done();
					});
				});
			});

			// remove user after each test
			afterEach(function (done) {
				User.remove({username: 'preexisting'}, function () {
					done();
				});
			});

			it('should return a 400', function (done) {
				request(app)
					.post('/api/users')
					.set('3day-app', 'test')
					.send({username: 'preexisting', password: 'catsss'})
					.expect(400, done);
			});

			it('should return contain the expected error body', function (done) {
				request(app)
					.post('/api/users')
					.set('3day-app', 'test')
					.send({username: 'preexisting', password: 'catsss'})
					.end(function (err, res) {
						should.not.exist(err);
						res.body.should.be.an.Object();
						should.exist(res.body.message);
						res.body.message.should.be.equal('Username not unique');
						res.body.reason.should.be.equal(15000);
						done();
					});
			});
		});
	});

	describe('with an authorization header', function () {

		var user, duplicateUser;

		before(function (done) {
			// we need a user
			user = new User({username: 'updateuser', password: 'catsss'});
			duplicateUser = new User({username: 'duplicateuser', password: 'catsss'});
			User.remove({username: 'updateuser'}, function (err) {
				if (err) {
					throw err;
				}
				User.remove({username: 'duplicateuser'}, function (err) {
					if (err) {
						throw err;
					}
					user.save(function (err) {
						if (err) {
							throw err;
						}
						duplicateUser.save(function (err) {
							if (err) {
								throw err;
							}
							done();
						});
					});
				});
			});
		});

		after(function (done) {
			user.remove(function (err) {
				if (err) {
					throw err;
				}
				duplicateUser.remove(function (err) {
					if (err) {
						throw err;
					}
					done();
				});
			});
		});

		describe('with no body', function () {

			it('should return a 400', function (done) {
				request(app)
					.post('/api/users')
					.auth('updateuser', 'catsss')
					.set('3day-app', 'test')
					.expect(400, done);
			});

			it('should return containing the expected error body', function (done) {
				request(app)
					.post('/api/users')
					.auth('updateuser', 'catsss')
					.set('3day-app', 'test')
					.end(function (err, res) {
						should.not.exist(err);
						res.body.should.be.an.Object();
						should.exist(res.body.message);
						res.body.message.should.be.equal('Bad request');
						res.body.reason.should.be.equal(10000);
						done();
					});
			});
		});

		describe('with wrong authentication', function () {

			it('should return a 401', function (done) {
				request(app)
					.post('/api/users')
					.auth('updateuser', 'catzss')
					.set('3day-app', 'test')
					.send({username: 'updatedusername', password: 'fred'})
					.expect(401, done);
			});

			it('should not return a response with WWW-Authenticate header', function (done) {
				request(app)
					.post('/api/users')
					.auth('updateuser', 'catzss')
					.set('3day-app', 'test')
					.send({username: 'updatedusername', password: 'fred'})
					.end(function (err, res) {
						should.not.exist(err);
						var header = res.headers['www-authenticate'];
						should(header).be.undefined;
						done();
					});
			});
		});

		describe('with both username and password', function () {

			it('should update the user', function (done) {
				request(app)
					.post('/api/users')
					.auth('updateuser', 'catsss')
					.set('3day-app', 'test')
					.send({username: 'updatedusername', password: 'freddy'})
					.end(function (err, res) {
						should.not.exist(err);
						res.body.should.be.an.Object();
						should.exist(res.body.message);
						res.body.message.should.be.equal('Updated');
						User.findOne({username: 'updateuser'}, function (err, user) {
							// we expect to not find this user
							should.not.exist(err);
							should.not.exist(user);
							// but we should find the new user - and validate its password
							User.findOne({username: 'updatedusername'}, function (err, user) {
								user.username.should.equal('updatedusername');
								user.validatePassword('freddy')
									.then(isMatch => {
										isMatch.should.be.true();
										done();
									})
									.catch(err => done(err));
							});
						});
					});
			});
		});


		describe('renaming to a duplicate user', function () {

			it('should return a 400 error', function (done) {
				request(app)
					.post('/api/users')
					.auth('updatedusername', 'freddy')
					.set('3day-app', 'test')
					.send({username: 'duplicateuser', password: 'freddy'})
					.end(function (err, res) {
						should.not.exist(err);
						res.body.should.be.an.Object();
						should.exist(res.body.reason);
						res.body.reason.should.be.equal(15000);
						res.body.message.should.be.equal('Username not unique');
						done();
					});
			});
		});
	});

});

describe('GET /api/users', function () {

	var user;

	after(function(done) {
		server.close();
		done();
	});

	before(function (done) {
		User.remove({username: 'iankelly'}, function (err) {
			if (err) {
				throw err;
			}
			user = new User({username: 'iankelly', password: 'greatpassword'});
			user.save(function (err) {
				if (err) {
					throw err;
				}
				done();
			});
		});
	});

	after(function (done) {
		user.remove(function (err) {
			if (err) {
				throw err;
			}
			done();
		});
	});

	it('should return the user', function (done) {

		request(app)
			.get('/api/users')
			.set('3day-app', 'test')
			.auth('iankelly', 'greatpassword')
			.end(function (err, res) {
				should.not.exist(err);
				res.body.should.be.an.Object();
				should.exist(res.body.id);
				res.body.id.should.be.equal(user._id.toString());
				res.body.username.should.be.equal('iankelly');
				res.body.reportCount.should.be.equal(0);
				done();
			});
	});

	describe('with a user with a report', function () {

		var report;

		before(function (done) {

			report = new Report({userid: user._id});
			report.save(function (err) {
				if (err) {
					throw err;
				}
				done();
			});
		});

		after(function (done) {
			report.remove(function (err) {
				if (err) {
					throw err;
				}
				done();
			});
		});

		it('should have the report count of 1', function (done) {

			request(app)
				.get('/api/users')
				.set('3day-app', 'test')
				.auth('iankelly', 'greatpassword')
				.end(function (err, res) {
					should.not.exist(err);
					res.body.should.be.an.Object();
					should.exist(res.body.id);
					res.body.id.should.be.equal(user._id.toString());
					res.body.username.should.be.equal('iankelly');
					res.body.reportCount.should.be.equal(1);
					done();
				});
		});
	});
});
