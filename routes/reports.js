/**
 * @description Route to handle operations on the /api/reports resource
 *
 * @author - Ian Kelly
 */

'use strict';

const Report = require('../models').Report;
const httpStatus = require('http-status');
const constants = require('../lib/constants');

const errorResponse = {
	reason: constants.BAD_SYNTAX,
	message: 'Bad request'
};

/**
 * Route for POST /api/reports
 */
function* create(next) {

	const body = this.request.body;
	const	user = this.state.user;
	var report;

	if (!body || !body.date || !body.categories) {
		return this.send(httpStatus.BAD_REQUEST, errorResponse);
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

	this.send(httpStatus.CREATED, { message: 'Created' });
}

/**
 * Route for GET /api/reports/:skip/:number
 */
function* retrieve() {

	const reports = yield Report.find({ userid: this.state.user._id },
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
		return this.send(httpStatus.BAD_REQUEST, errorResponse);
	}

	// find and update the report
	const report = yield Report.findByIdAndUpdate(this.params.id, body);
	// set the latest action on the user
	yield this.state.user.setLatest();

	if (report) {
		this.send({ message: 'Updated' });
	} else {
		this.send(httpStatus.NOT_FOUND, {	message: 'Not Found' });
	}
}

/**
 * Route for DELETE /api/reports/:id
 */
function* remove() {

	const report = yield Report.findByIdAndRemove(this.params.id);

	if (report) {
		this.send({ message: 'Deleted' });
	} else {
		this.send(httpStatus.NOT_FOUND, { message: 'Not Found' });
	}
}

module.exports = {
	create: create,
	retrieve: retrieve,
	update: update,
	remove: remove
};
