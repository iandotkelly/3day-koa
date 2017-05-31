/**
* @description Route for /api/timeline
*
* @author Ian Kelly
*/

'use strict';

const Report = require('../models/report');
const httpStatus = require('http-status');

/**
* Get reports by 3Day Timeline
*
* POST /api/timeline/from/:timefrom/to/:timeto
*/
function* byTime() {

	const timeFrom = new Date(this.params.timefrom);
	const timeTo = new Date(this.params.timeto);
	const req = this.request;
	const user = this.state.user;

	var shortList;

	if (req.body && req.body.length && req.body.length > 0) {
		shortList = req.body;
	}

	const followingIds = yield user.allAuthorized(shortList);

	this.body = yield Report.find({
			'userid': {
				$in: followingIds
			},
			'date': {
				$gte: timeFrom,
				$lt: timeTo
			}
		})
		.select('-__v -_id -updated')
		.sort('-date')
		.limit(5000)	// put a sensible big upper limit - don't want to stress things
		.exec();
}

/**
* Get reports by server timeline
*
* POST /api/timeline/:time/:number
*/
function* byPage() {

	var time = this.params.time;
	time = time === '0' ? new Date() : time;
	const req = this.request;
	const number = Number(this.params.number || 100);
	const user = this.state.user;

	var shortList;

	if (req.body && req.body.length && req.body.length > 0) {
		shortList = req.body;
	}

	const followingIds = yield user.allAuthorized(shortList);

	this.body =	yield Report.find({
			'userid': {
				$in: followingIds
			},
			'created': {
				$lt: new Date(time)
			}
		})
		.select('-__v -_id -updated')
		.sort('-created')
		.limit(number)
		.exec();
}

module.exports = {
	bytime: byTime,
	bypage: byPage
};
