/**
 * @description Image REST API
 *
 * @author Ian Kelly
 * @copyright Copyright (C) Ian Kelly
 */

'use strict';

const busboy = require('co-busboy');
const grid = require('gridfs-stream');
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const reasonCodes = require('../lib/constants').reasonCodes;
const config = require('../config');
const Report = require('../models').Report;

var gfs;

// Constants
//
var MULTIPART_HEADER = 'multipart/*';

// assign mongoose's mongodb driver to Grid
grid.mongo = mongoose.mongo;

// creaete connection
const connection = mongoose.createConnection(config.database);
connection.once('open', function() {
	gfs = grid(connection.db);
});

//

/**
 * ugly attempt to remove the file a second
 * after we discover a problem - only way I could
 * find of doing this
 *
 * @param  {Array} ids  An array of GFS file IDS
 */
function deleteFilesEventually(ids) {
	ids.forEach(function(id) {
		setTimeout(function() {
			// remove with an empty callback as
			// to be honest, we don't care, this
			// an exception, and can be cleaned up later if
			// needed
			gfs.remove({
				_id: id
			}, function() {});
		}, 1000);
	});

}
/**
 * REST API
 *
 * PUT /api/image - upload a new image
 */
function* create(next) {

	// this request *must* be a multipart form - if we don't
	// reject this,  busboy will time out
	if (!this.request.is(MULTIPART_HEADER)) {
		return this.send(httpStatus.BAD_REQUEST, {
				status: 'failed',
				reason: reasonCodes.NOT_MULTIPART,
				message: 'Not a multipart request'
		});
	}

	const userId = this.request.user._id;

	var parts = busboy(this, {
		autoFields: true,
	});

	// jshint -W084
	var part;
	var fileIds = [];
	while (part = yield parts) {
		var writeStream = gfs.createWriteStream({
			mode: 'w',
			content_type: part.mimeType,
			metadata: {
				user: userId
			}
		});
		part.pipe(writeStream);
		// record the (hopefully one) file ID
		fileIds.push(writeStream.id);
	}

	// if a strange number of files found
	if (fileIds.length !== 1) {
		deleteFilesEventually(fileIds);
		return this.send(httpStatus.BAD_REQUEST, {
			status: 'failed',
			reason: fileIds.length === 0 ? reasonCodes.NO_IMAGE_FOUND : reasonCodes.TOO_MANY_FILES,
			message: 'No image found'
		});
	}

	var metadata;
	try {
		metadata = JSON.parse(parts.field.metadata);
	} catch (err) {}

	// the value must include a report id string
	if (metadata === undefined || typeof metadata.reportid !== 'string') {
		deleteFilesEventually(fileIds);
		return this.send(httpStatus.BAD_REQUEST, {
			status: 'failed',
			reason: reasonCodes.MISSING_REPORT_ID,
			message: 'No report ID'
		});
	}

	// retrieve the report
	var report = yield Report.findOne({
		_id: metadata.reportid,
		userid: userId
	});

	if (!report) {
		deleteFilesEventually(fileIds);
		return this.send(httpStatus.BAD_REQUEST, {
			status: 'failed',
			reason: reasonCodes.REPORT_NOT_FOUND,
			message: 'Report not found'
		});
	}

	// update the report with the file ID and description
	report.images.push({
		id: fileIds[0],
		description: metadata.description
	});

	// save the report
	yield report.save()
		.then(() => this.send({ status: 'ok', id: fileIds[0] }))
		.catch(err => this.throw(err));
}

/**
 * Retrieve an image
 *
 * GET /api/image/:id - retrieve an image with id
 */
function* retrieve(req, res, next) {

	var user = this.request.user;
	var id;

	// try to parse the ID, as we only accept mongo object IDs
	try {
		id = mongoose.Types.ObjectId(this.params.id);
	} catch (err) {
		return this.send(httpStatus.BAD_REQUEST, {
			status: 'failed',
			reasonCode: reasonCodes.BAD_ID,
			message: 'Bad Request'
		});
	}

	// find the file
	var file = yield gfs.files.findOne({ _id: id });

	// if no file - then 404
	if (!file) {
		return this.send(httpStatus.NOT_FOUND, {
			status: 'failed',
			message: 'Not found'
		});
	}

	// if unauthorized
	var authorized = yield user.isAuthorized(file.metadata.user);
	if (!authorized) {
		return this.send(httpStatus.UNAUTHORIZED, {
			status: 'failed',
			message: 'Unauthorized'
		});
	}

	// ok - we can stream this file
	this.type = file.contentType;
	this.body = gfs.createReadStream({ _id: id });
}

/**
 * Delete an image
 *
 * DELETE /api/image/:id - delete an image with id
 */
function* remove() {

	const user = this.request.user;

	const file = yield gfs.files.findOne({ _id: this.param.id	});

	if (!file) {
		return this.status(httpStatus.NOT_FOUND, {
			status: 'failed'
		});
	}

	if (file.userid !== user._id) {
		// this file is not owned by the user
		return this.status(httpStatus.UNAUTHORIZED, {
			status: 'failed',
			message: 'Unauthorized'
		});
	}

	yield gfs.remove({ _id: this.params.id })
		.then(() => {
			this.body = {
				status: 'ok'
			};
		});
}

module.exports = {
	create: create,
	retrieve: retrieve,
	remove: remove
};
