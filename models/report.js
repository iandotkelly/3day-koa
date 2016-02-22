/**
 * @description Model for a report
 *
 * @author Ian Kelly
 * @copyright Copyright (C) Ian Kelly
 */

'use strict';

// db connection
var db = require('../lib/db-connection');

var reportSchema = db.Schema({

	userid: {
		type: db.Schema.ObjectId,
		required: true
	},
	date: {
		type: Date,
		default: Date.now
	},
	categories: [
		{
			type: {
				type: String,
				required: true
			},
			checked: {
				type: Boolean,
				default: false
			},
			message: {
				type: String
			}
		}
	],
	images: [
		{
			id: {
				type: db.Schema.ObjectId,
				required: true
			},
			description: {
				type: String
			}
		}
	],
	// default created / updated
	created: { type: Date, default: Date.now },
	updated: { type: Date, default: Date.now }

});

/**
 * Find a report by the image ID
 *
 * @param  {ObjectId}   imageId  The ObjectId of the image
 * @param  {Function}	callback Callback(err, report)
 */
reportSchema.statics.findByImageId = function (imageId, callback) {

	this.findOne({ 'images.id': imageId }, callback);

};

/**
 * Remove an image
 *
 * @param  {ObjectId}   imageId  The ObjectId of the image
 * @param  {Function}	callback Callback(err, numAffected)
 */
reportSchema.statics.removeImageByImageId = function (imageId, callback) {

	this.update({
		'images.id': imageId
	},
	{
		$pull: {
			'images': { id: imageId }
		}
	},
	{
		multi: false
	},
	callback);
};

// we are exporting the mongoose model
module.exports = db.model('Report', reportSchema);
