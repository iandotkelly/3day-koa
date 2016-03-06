/**
 * Gulp Buildfile
 */

'use strict';

var mongoose = require('mongoose');

var paths = {
  javascript: ['**/*.js', '!node_modules/**/*'],
  tests: ['test/**/*.js']
};

var gulp = require('gulp');
var mocha = require('gulp-mocha');

gulp.task('default', ['lint', 'test']);
var jshint = require('gulp-jshint');
var gulp   = require('gulp');

gulp.task('lint', function() {
  return gulp.src(paths.javascript)
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

gulp.task('test', () => {
  return gulp.src(paths.tests, {read: false})
    .pipe(mocha({
      should: require('should')
    }))
    .once('error', () => {
      mongoose.connection.close();
    })
    .once('end', () => {
      mongoose.connection.close();
    });
});
