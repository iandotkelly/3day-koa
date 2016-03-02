/**
 * @description Route to handle operations on the /api/reports resource
 *
 * @author - Ian Kelly
 */

'use strict';

var Report = require('../models').Report;
var httpStatus = require('http-status');
var constants = require('../lib/constants');

var errorResponse = {
	reason: constants.BAD_SYNTAX,
	message: 'Bad request'
};

/**
 * Route for POST /api/reports
 */
function* create(next) {

	const body = this.request.body;
	const	user = this.request.user;
	var report;

	if (!body || !body.date || !body.categories) {
		this.status = httpStatus.BAD_REQUEST;
		this.body = errorResponse;
		return;
	}

	report = new Report({
		userid: user._id,
		date: body.date,
		categories: body.categories
	});

	// save the report
	yield report.save()
		.then(() => user.setLatest())
		.catch(err => this.throw(err));

	this.status = httpStatus.CREATED;
	this.body = { message: 'Created' };
}

/**
 * Route for GET /api/reports/:skip/:number
 */
function* retrieve() {

	const reports = yield Report.find({ userid: this.request.user._id },
		'-__v', {
			skip: this.params.skip || 0,
			limit: this.params.number || 1,
			sort: {
				date: -1 // sort by report date DESC
			}
		});

	this.body = reports;
}

/**
 * Route for POST /api/reports/:id
 */
function* update() {

	const body = this.request.body;
	if (!body || !body.date || !body.categories) {
		this.status = httpStatus.BAD_REQUEST;
		this.body = errorResponse;
		return;
	}

	// find and update the report
	const report = yield Report.findByIdAndUpdate(this.params.id, body);
	// set the latest action on the user
	yield this.request.user.setLatest();

	if (report) {
		this.body = { message: 'Updated' };
	} else {
		this.status = httpStatus.NOT_FOUND;
		this.body = {	message: 'Not Found' };
	}
}

/**
 * Route for DELETE /api/reports/:id
 */
function* remove() {

	const report = yield Report.findByIdAndRemove(this.params.id);

	if (report) {
		this.body = { message: 'Deleted' };
	} else {
		this.status = httpStatus.NOT_FOUND;
		this.body = { message: 'Not Found' };
	}
}

module.exports = {
	create: create,
	retrieve: retrieve,
	update: update,
	remove: remove
};
