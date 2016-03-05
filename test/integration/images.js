/**
 * @description Test for the /api/users API
 */

'use strict';

var request = require('supertest-koa-agent');
var should = require('should');
var mongoose = require('mongoose');
var Grid = require('gridfs-stream');
var config = require('../../config');
var ObjectId = mongoose.Types.ObjectId;
var User = require('../../models').User;
var Report = require('../../models').Report;

var gfs;

// assign mongoose's mongodb driver to Grid
Grid.mongo = mongoose.mongo;

var threeday = require('../../app');
var app = threeday.app;
var server = threeday.server;

// creaete connection
var connection = mongoose.createConnection(config.database);
connection.once('open', function () {
	gfs = new Grid(connection.db);
});

describe('The images API', function () {

	var user, otherUser, report;

	var imageId; // used to link an image used between tests

	before(function (done) {
		// ensure the user has been deleted from last tests even if failed
		User.remove({username: 'reportsintegration'}, function (err) {
			if (err) {
				throw err;
			}

			User.remove({username: 'otheruser'}, function (err) {
				if (err) {
					throw err;
				}

				// create a user for all the tests
				user = new User({ username: 'reportsintegration', password: 'catsss' });
				otherUser = new User({ username: 'otheruser', password: 'catsss' });

				user.save(function (err) {
					if (err) {
						throw err;
					}

					otherUser.save(function (err) {
						if (err) {
							throw err;
						}
						// create a report
						report = new Report({
							userid: user._id,
							date: new Date()
						});
						// save the report
						report.save(function (err) {
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

	after(function (done) {
		// delete the user
		user.remove(function (err) {
			if (err) {
				throw err;
			}
			// delete the other user
			otherUser.remove(function (err) {
				if (err) {
					throw err;
				}
				// delete the report
				report.remove(function (err) {
					if (err) {
						throw err;
					}
					server.close();
					connection.close();
					done();
				});
			});
		});
	});

	describe('uploads', function () {

		describe('with no image', function () {

			it('should 400', function (done) {

				request(app)
					.post('/api/image')
					.set('3day-app', 'test')
					.auth('reportsintegration', 'catsss')
					.end(function (err, res) {
						should.not.exist(err);
						res.statusCode.should.be.equal(400);
						res.body.should.be.an.Object();
						res.body.status.should.be.equal('failed');
						res.body.reason.should.be.equal(20002);
						res.body.message.should.be.equal('Not a multipart request');
						done();
					});

			});
		});

		describe('with an image but no metadata', function () {

			it('should 400', function (done) {

				request(app)
					.post('/api/image')
					.set('3day-app', 'test')
					.auth('reportsintegration', 'catsss')
					.attach('image', 'test/fixtures/test.jpg')
					.end(function (err, res) {
						should.not.exist(err);
						res.statusCode.should.be.equal(400);
						res.body.should.be.an.Object();
						res.body.status.should.be.equal('failed');
						res.body.reason.should.be.equal(10001);
						res.body.message.should.be.equal('No report ID');
						done();
					});

			});
		});


		describe('with an image but bad metadata', function () {

			it('should 400', function (done) {

				request(app)
					.post('/api/image')
					.set('3day-app', 'test')
					.auth('reportsintegration', 'catsss')
					.set('Content-Type', 'multipart/form-data')
					.attach('image', 'test/fixtures/test.jpg')
					.field('metadata', 'thisissomecrappymetadata')
					.end(function (err, res) {
						should.not.exist(err);
						res.statusCode.should.be.equal(400);
						res.body.should.be.an.Object();
						res.body.status.should.be.equal('failed');
						res.body.reason.should.be.equal(10001);
						res.body.message.should.be.equal('No report ID');
						done();
					});

			});
		});

		describe('with an image, a report id but no report', function () {

			it('should 400', function (done) {
				request(app)
					.post('/api/image')
					.set('3day-app', 'test')
					.auth('reportsintegration', 'catsss')
					.set('Content-Type', 'multipart/form-data')
					.attach('image', 'test/fixtures/test.jpg')
					.field('metadata', JSON.stringify({
						reportid: mongoose.Types.ObjectId()
					}))
					.expect('Content-Type', /json/)
					.end(function (err, res) {
						should.not.exist(err);
						res.statusCode.should.be.equal(400);
						res.body.should.be.an.Object();
						res.body.status.should.be.equal('failed');
						res.body.reason.should.be.equal(20001);
						res.body.message.should.be.equal('Report not found');
						done();
					});
			});
		});

		describe('with an image, a report id but the report is owned by another user', function () {
			it('should 400', function (done) {
				request(app)
					.post('/api/image')
					.set('3day-app', 'test')
					.auth('otheruser', 'catsss')
					.set('Content-Type', 'multipart/form-data')
					.attach('image', 'test/fixtures/test.jpg')
					.field('metadata', JSON.stringify({
						reportid: report._id
					}))
					.expect('Content-Type', /json/)
					.end(function (err, res) {
						should.not.exist(err);
						res.statusCode.should.be.equal(400);
						res.body.should.be.an.Object();
						res.body.status.should.be.equal('failed');
						res.body.reason.should.be.equal(20001);
						res.body.message.should.be.equal('Report not found');
						done();
					});
			});
		});

		describe('with an image, and a valid a report id owned by the user', function () {

			it('should 200', function (done) {
				request(app)
					.post('/api/image')
					.set('3day-app', 'test')
					.auth('reportsintegration', 'catsss')
					.set('Content-Type', 'multipart/form-data')
					.attach('image', 'test/fixtures/test.jpg')
					.field('metadata', JSON.stringify({
						reportid: report._id
					}))
					.expect('Content-Type', /json/)
					.end(function (err, res) {
						should.not.exist(err);
						res.statusCode.should.be.equal(200);
						res.body.should.be.an.Object();
						res.body.status.should.be.equal('ok');
						res.body.id.should.be.a.string;
						// don't like using a timeout, but it isn't there
						// immediately the request completes
						setTimeout(function() {
							// check the file has been created
							gfs.files.findOne({_id: new ObjectId(res.body.id)}, function(err, file) {
								should.not.exist(err);
								should.exist(file);
								// record the id so we can delete the file
								// after the test
								imageId = res.body.id;
								done();
							});
						}, 500);
					});
			});
		});
	});

	describe('downloads', function () {

		// delete the image file file
		after(function (done) {

			setTimeout(function () {
				gfs.remove({
					_id: new ObjectId(imageId)
				}, function (err) {
					if (err) {
						throw err;
					}
					done();
				});
			}, 500);
		});

		describe('with an bad image ID', function () {

			it('should 400', function (done) {
				request(app)
					.get('/api/image/qwerty')
					.set('3day-app', 'test')
					.auth('reportsintegration', 'catsss')
					.expect('Content-Type', /json/)
					.end(function (err, res) {
						should.not.exist(err);
						res.statusCode.should.be.equal(400);
						res.body.should.be.an.Object();
						res.body.status.should.be.equal('failed');
						done();
					});
			});
		});

		describe('with an unknown image ID', function () {

			it('should 404', function (done) {
				request(app)
					.get('/api/image/abcdabcdabcdabcdabcdabcd')
					.set('3day-app', 'test')
					.auth('reportsintegration', 'catsss')
					.expect('Content-Type', /json/)
					.end(function (err, res) {
						should.not.exist(err);
						res.statusCode.should.be.equal(404);
						res.body.should.be.an.Object();
						res.body.status.should.be.equal('failed');
						done();
					});
			});
		});

		describe('with an unauthorized user', function () {

			it('should 401', function (done) {
				request(app)
					.get('/api/image/' + imageId)
					.set('3day-app', 'test')
					.auth('otheruser', 'catsss')
					.expect('Content-Type', /json/)
					.end(function (err, res) {
						should.not.exist(err);
						res.statusCode.should.be.equal(401);
						res.body.should.be.an.Object();
						res.body.status.should.be.equal('failed');
						done();
					});
			});

		});


		describe('with an authorized user', function () {

			it('should 200', function (done) {
				request(app)
					.get('/api/image/' + imageId)
					.set('3day-app', 'test')
					.auth('reportsintegration', 'catsss')
					.end(function (err, res) {
						should.not.exist(err);
						res.statusCode.should.be.equal(200);
						res.headers['content-type'].should.be.equal('image/jpeg');
						done();
					});
			});

		});
	});
});
