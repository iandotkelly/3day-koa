/**
* @description Test for the /api/timeline API
*
* @author Ian Kelly
*/

'use strict';

var request = require('supertest-koa-agent');
var should = require('should');
var eachSeries = require('async').eachSeries;

var User = require('../../models').User;
var Report = require('../../models').Report;

var threeday = require('../../app');
var app = threeday.app;
var server = threeday.server;

describe('POST /api/timeline', function() {

	var user, fA, fB, bu;

	var ru1, ru2, rA1, rA2, rB1, rB2, bu1, bu2, userReport;


	before(function(done) {

		user = new User({username: 'iandotkelly', password: 'catsss'});
		fA = new User({username: 'followingA', password: 'catsss'});
		fB = new User({username: 'followingB', password: 'catsss'});
		bu = new User({username: 'blockedu', password: 'catsss'});

		user.following = [{id: fA._id}, {id: fB._id}, {id: bu._id}];

		fA.followers = [
			{
				id: user._id,
				status: {
					active: true,
					approved: true,
					blocked: false
				}
			}
		];

		fB.followers = [
			{
				id: user._id,
				status: {
					active: true,
					approved: true,
					blocked: false
				}
			}
		];

		bu.followers = [
			{
				id: user._id,
				status: {
					active: true,
					approved: true,
					blocked: true
				}
			}
		];

		var users = [user, fA, fB, bu];

		eachSeries(users, function(u, cb) {
			User.remove({
				username: u.username
			}, function (err) {
				if (err) {
					cb(err);
				}

				u.save(function (err) {
					if (err) {
						throw err;
					}

					// remove all the reports before adding some more
					Report.remove({}, function (err) {
						if (err) {
							throw err;
						}

						userReport = new Report({
							userid: user._id,
							date: new Date('Wed May 28 2014 15:01:00 GMT+0000'),
							created: new Date('Wed May 28 2014 15:01:00 GMT-0400')
						});

						// user is on east coast
						ru1 = new Report({
							userid: user._id,
							date: new Date('Wed May 28 2014 14:30:00 GMT+0000'),
							created: new Date('Wed May 28 2014 14:30:00 GMT-0400')
						});

						ru2 = new Report({
							userid: user._id,
							date: new Date('Wed May 28 2014 14:45:00 GMT+0000'),
							created: new Date('Wed May 28 2014 14:45:00 GMT-0400')
						});

						// following fA who is in the UK
						rA1 = new Report({
							userid: fA._id,
							date: new Date('Wed May 28 2014 18:31:00 GMT+0000'),
							created: new Date('Wed May 28 2014 14:31:00 GMT-0400')
						});

						rA2 = new Report({
							userid: fA._id,
							date: new Date('Wed May 28 2014 18:46:00 GMT+0000'),
							created: new Date('Wed May 28 2014 14:46:00 GMT-0400')
						});

						// following fB who is in California
						rB1 = new Report({
							userid: fB._id,
							date: new Date('Wed May 28 2014 11:32:00 GMT+0000'),
							created: new Date('Wed May 28 2014 14:32:00 GMT-0400')
						});

						rB2 = new Report({
							userid: fB._id,
							date: new Date('Wed May 28 2014 11:47:00 GMT+0000'),
							created: new Date('Wed May 28 2014 14:47:00 GMT-0400')
						});

						// following bu who is also in California
						bu1 = new Report({
							userid: bu._id,
							date: new Date('Wed May 28 2014 11:33:00 GMT+0000'),
							created: new Date('Wed May 28 2014 14:33:00 GMT-0400')
						});

						bu2 = new Report({
							userid: bu._id,
							date: new Date('Wed May 28 2014 11:48:00 GMT+0000'),
							created: new Date('Wed May 28 2014 14:48:00 GMT-0400')
						});


						var reports = [ru1, ru2, rA1, rA2, rB1, rB2, bu1, bu2, userReport];

						eachSeries(reports, function(report, cb) {
							report.save(cb);
						}, function (err) {
							if (err) {
								throw err;
							}
							cb();
						});
					});
				});
			});
		}, function (err) {
			if (err) {
				throw err;
			}
			done();
		});

	});

	after(function (done) {
		var users = [user, fA, fB, bu];

		eachSeries(users, function(u, cb) {
			u.remove(cb);
		}, function (err) {
			if (err) {
				throw err;
			}
			// finally remove the reports
			Report.remove({}, function (err) {
				if (err) {
					throw err;
				}
				server.close();
				done();
			});
		});
	});

	describe('with a start time and end time between reports', function() {

		it('should return nothing', function (done) {

			request(app)
				.post('/api/timeline/from/2014-05-28T14:46:10/to/2014-05-28T14:46:50')
				.set('3day-app', 'test')
				.auth('iandotkelly', 'catsss')
				.end(function (err, res) {
					should.not.exist(err);
					res.body.should.be.an.Array();
					res.body.length.should.be.equal(0);
					done();
				});
		});
	});


	describe('with a start time and end time around one report', function() {

		it('should return the one report', function (done) {

			request(app)
				.post('/api/timeline/from/2014-05-28T11:46:50/to/2014-05-28T11:47:10')
				.set('3day-app', 'test')
				.auth('iandotkelly', 'catsss')
				.end(function (err, res) {
					should.not.exist(err);
					res.body.should.be.an.Array();
					res.body.length.should.be.equal(1);
					res.body[0].userid.should.equal(fB._id.toString());
					done();
				});
		});
	});


	describe('with a start time and end time around all the reports', function() {

		it('should return only the authorized reports in order', function (done) {

			request(app)
				.post('/api/timeline/from/2014-05-28T11:00:00/to/2014-05-28T20:00:00')
				.set('3day-app', 'test')
				.auth('iandotkelly', 'catsss')
				.end(function (err, res) {
					should.not.exist(err);
					res.body.should.be.an.Array();
					res.body.length.should.be.equal(7);
					res.body[0].userid.should.equal(fA._id.toString());
					res.body[1].userid.should.equal(fA._id.toString());
					res.body[2].userid.should.equal(user._id.toString());
					res.body[3].userid.should.equal(user._id.toString());
					res.body[4].userid.should.equal(user._id.toString());
					res.body[5].userid.should.equal(fB._id.toString());
					res.body[6].userid.should.equal(fB._id.toString());
					done();
				});
		});
	});

	describe('with a start time after all the reports and a big limit', function() {

		it('should do return all the authorized reports', function (done) {

			request(app)
				// 7pm - well after all the reports - and ask for 100 of them
				.post('/api/timeline/2014-05-28T19:00:00/100')
				.set('3day-app', 'test')
				.auth('iandotkelly', 'catsss')
				.end(function (err, res) {
					should.not.exist(err);
					res.body.should.be.an.Array();
					var results = res.body;
					results.length.should.be.equal(6);
					(+ new Date(results[0].created)).should.be.equal(+rB2.created);
					(+ new Date(results[1].created)).should.be.equal(+rA2.created);
					(+ new Date(results[2].created)).should.be.equal(+ru2.created);
					(+ new Date(results[3].created)).should.be.equal(+rB1.created);
					(+ new Date(results[4].created)).should.be.equal(+rA1.created);
					(+ new Date(results[5].created)).should.be.equal(+ru1.created);
					done();
				});
		});

		describe('except when it has a shortlist', function() {

			it('when it should only return shortlisted users reports', function (done) {

				request(app)
					// 7pm - well after all the reports - and ask for 100 of them
					.post('/api/timeline/2014-05-28T19:00:00/100')
					.set('3day-app', 'test')
					.auth('iandotkelly', 'catsss')
					.send([fB._id])
					.end(function (err, res) {
						should.not.exist(err);
						res.body.should.be.an.Array();
						var results = res.body;
						results.length.should.be.equal(2);
						(+ new Date(results[0].created)).should.be.equal(+rB2.created);
						(+ new Date(results[1].created)).should.be.equal(+rB1.created);
						done();
					});
			});
		});


		describe('except when it has a shortlist of myself', function() {

			it('when it should only return shortlisted users reports', function (done) {

				request(app)
					// 10pm - well after all the reports - and ask for 100 of them
					.post('/api/timeline/2014-05-28T22:00:00/100')
					.set('3day-app', 'test')
					.auth('iandotkelly', 'catsss')
					.send([user._id.toString()])
					.end(function (err, res) {
						should.not.exist(err);
						res.body.should.be.an.Array();
						var results = res.body;
						results.length.should.be.equal(3);
						(+ new Date(results[0].created)).should.be.equal(+userReport.created);
						(+ new Date(results[1].created)).should.be.equal(+ru2.created);
						(+ new Date(results[2].created)).should.be.equal(+ru1.created);
						done();
					});
			});
		});
	});

	describe('with a start time after all the reports and a limit of 2', function() {

		it('should do return just the latest 2 reports', function (done) {

			request(app)
				// 7pm - well after all the reports - and ask for 100 of them
				.post('/api/timeline/2014-05-28T19:00:00/2')
				.set('3day-app', 'test')
				.auth('iandotkelly', 'catsss')
				.end(function (err, res) {
					should.not.exist(err);
					res.body.should.be.an.Array();
					var results = res.body;
					results.length.should.be.equal(2);
					(+ new Date(results[0].created)).should.be.equal(+rB2.created);
					(+ new Date(results[1].created)).should.be.equal(+rA2.created);
					done();
				});
		});
	});


	describe('with a start time in the middle reports and a big limit', function() {

		it('should do return half the authorized reports', function (done) {

			request(app)
				// 7pm - well after all the reports - and ask for 100 of them
				.post('/api/timeline/2014-05-28T18:40:00/100')
				.set('3day-app', 'test')
				.auth('iandotkelly', 'catsss')
				.end(function (err, res) {
					should.not.exist(err);
					res.body.should.be.an.Array();
					var results = res.body;
					results.length.should.be.equal(3);
					(+ new Date(results[0].created)).should.be.equal(+rB1.created);
					(+ new Date(results[1].created)).should.be.equal(+rA1.created);
					(+ new Date(results[2].created)).should.be.equal(+ru1.created);
					done();
				});
		});
	});
});
