/**
 * @description Test for the /api/followers API
 */

'use strict';

var request = require('supertest-koa-agent');
var should = require('should');
var User = require('../../models').User;
var ObjectId = require('mongoose').Types.ObjectId;

var threeday = require('../../app');
var app = threeday.app;
var server = threeday.server;

describe('The followers API ', function() {

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
          username: 'myuser'
        }, function(err) {
          if (err) {
            throw err;
          }
          // add users
          user = new User({
            username: 'myuser',
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
          friend1.following.push({
            id: user._id
          });
          user.followers.push({
            id: friend1._id,
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

  describe('GET /api/followers', function() {

    describe('for a user without followers', function() {

      it('should return a 200', function(done) {
        request(app)
          .get('/api/followers')
          .set('3day-app', 'test')
          .auth('friend1', 'catsss')
          .expect(200, done);
      });

      it('should return an empty array', function(done) {
        request(app)
          .get('/api/followers')
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
          .get('/api/followers')
          .set('3day-app', 'test')
          .auth('myuser', 'catsss')
          .expect(200, done);
      });

      it('should return the users in an array', function(done) {
        request(app)
          .get('/api/followers')
          .set('3day-app', 'test')
          .auth('myuser', 'catsss')
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.be.an.Array();
            res.body.length.should.be.equal(1);
            res.body[0].id.should.be.equal(friend1._id.toString());
            res.body[0].username.should.be.equal('friend1');
            res.body[0].status.approved.should.be.equal(true);
            res.body[0].status.blocked.should.be.equal(false);
            done();
          });
      });

      it('should strip out the unnecessary fields', function(done) {
        request(app)
          .get('/api/followers')
          .set('3day-app', 'test')
          .auth('myuser', 'catsss')
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.be.an.Array();
            res.body.length.should.be.equal(1);
            should(res.body[0]._id).be.undefined;
            should(res.body[0].status.active).be.undefined;
            done();
          });
      });
    });


    describe('if the person following is not active', function() {

      before(function(done) {
        user.followers[0].status.active = false;
        user.save(function (err) {
          should(err).be.null;
          done();
        });
      });

      it('should return a 200', function(done) {
        request(app)
          .get('/api/followers')
          .set('3day-app', 'test')
          .auth('myuser', 'catsss')
          .expect(200, done);
      });

      it('should not return the inactive user', function(done) {
        request(app)
          .get('/api/followers')
          .set('3day-app', 'test')
          .auth('myuser', 'catsss')
          .end(function(err, res) {
            should.not.exist(err);
            res.body.should.be.an.Array();
            res.body.length.should.be.equal(0);
            done();
          });
      });
    });
  });

  describe('POST /api/followers/:id', function() {

    describe('with no ID', function() {

      it('should return a 404', function(done) {
        request(app)
          .post('/api/followers')
          .set('3day-app', 'test')
          .auth('myuser', 'catsss')
          .expect(404, done);
      });
    });

    describe('with a bad ID', function() {

      it('should return a 400', function(done) {
        request(app)
          .post('/api/followers/foobar')
          .set('3day-app', 'test')
          .auth('myuser', 'catsss')
          .expect(400, done);
      });
    });

    describe('with an unknown ID', function() {

      it('should return a 400', function(done) {
        request(app)
          .post('/api/followers/' + new ObjectId())
          .set('3day-app', 'test')
          .auth('myuser', 'catsss')
          .expect(400, done);
      });
    });

    describe('with an known ID but no body', function() {

      it('should return a 400', function(done) {
        request(app)
          .post('/api/followers/' + friend1._id)
          .set('3day-app', 'test')
          .auth('myuser', 'catsss')
          .expect(400, done);
      });
    });


    describe('with an known ID with none of the right parameters', function() {

      it('should return a 400', function(done) {
        request(app)
          .post('/api/followers/' + friend1._id)
          .set('3day-app', 'test')
          .auth('myuser', 'catsss')
          .send({fred:100})
          .expect(400, done);
      });
    });


    describe('with an known ID with an approved parameter', function() {

      it('should return a 400', function(done) {
        User.findOne({username: 'myuser'}, function (err, ub) {
          ub.followers[0].status.approved.should.be.true;
          request(app)
            .post('/api/followers/' + friend1._id)
            .set('3day-app', 'test')
            .auth('myuser', 'catsss')
            .send({approved:false})
            .end(function(err, response) {
              should.not.exist(err);
              response.status.should.be.equal(200);
              response.body.status.should.be.equal('success');
              User.findOne({username: 'myuser'}, function (err, ua) {
                ua.followers[0].status.approved.should.be.false;
                done();
              });
            });
        });

      });
    });


    describe('with an known ID with an blocked parameter', function() {

      it('should return a 400', function(done) {
        User.findOne({username: 'myuser'}, function (err, ub) {
          ub.followers[0].status.blocked.should.be.false;
          request(app)
            .post('/api/followers/' + friend1._id)
            .set('3day-app', 'test')
            .auth('myuser', 'catsss')
            .send({blocked:true})
            .end(function(err, response) {
              should(err).be.null;
              response.status.should.be.equal(200);
              response.body.status.should.be.equal('success');
              User.findOne({username: 'myuser'}, function (err, ua) {
                ua.followers[0].status.blocked.should.be.true;
                done();
              });
            });
        });

      });
    });


    describe('with an known ID with both parameters', function() {

      it('should return a 400', function(done) {
        User.findOne({username: 'myuser'}, function (err, ub) {
          ub.followers[0].status.approved.should.be.false;
          ub.followers[0].status.blocked.should.be.true;
          request(app)
            .post('/api/followers/' + friend1._id)
            .set('3day-app', 'test')
            .auth('myuser', 'catsss')
            .send({blocked:false, approved:true})
            .end(function(err, response) {
              should(err).be.null;
              response.status.should.be.equal(200);
              response.body.status.should.be.equal('success');
              User.findOne({username: 'myuser'}, function (err, ua) {
                ua.followers[0].status.blocked.should.be.false;
                ua.followers[0].status.approved.should.be.true;
                done();
              });
            });
        });

      });
    });
  });

});
