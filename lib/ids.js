/**
* @description	Utility to find index of object in an array, when the
*				item has an ObjectId in the id property
*/
'use strict';

/**
* Returns the index of the first matching ID in an array
*
* @param {Array}       array The array containing objects with id
* @param {ObjectId}    id    The objectid
*/
function indexOfId(array, id) {

	if (!Array.isArray(array)) {
		throw new Error('Should only be called on an array');
	}

	if (id === undefined) {
		throw new Error('id must be defined');
	}

	var index, len, itemId;

	for (index = 0, len = array.length; index < len; index++) {
		itemId = array[index].id;
		if (itemId) {
			// we prefer the equals method if available
			if ((typeof itemId.equals === 'function' && itemId.equals(id)) || itemId === id) {
				return index;
			}
		}
	}

	return -1;
}

/**
* Returns array of all IDs
*
* @param {Array} array   	The array of objects
* @param {Object} options	An optional options object
*							{ shortList: an array of IDs which need to match,
*							  idName: the name of the ID field, e.g. '_id' }
*/
function listOfIds(array, options) {
	/* jshint maxcomplexity: 9, strict: true */

	if (!Array.isArray(array)) {
		throw new Error('array must be an array');
	}

	options = options || {};
	var idName = options.idName || 'id';
	var shortList = prepShortlist(options.shortList);

	var ids = [];

	for (var index = 0, len = array.length; index < len; index++) {
		var id = array[index][idName];

		if (!id) {
			continue;
		}

		// if there is no shortlist, or if this ID matches it
		if (!shortList || shortList.indexOf(id.toString()) !== -1) {
			// and make sure we only add one
			if (ids.indexOf(id) === -1) {
				ids.push(id);
			}
		}
	}

	return ids;
}

/**
* Make a shortlist a list of strings
*
* @param {Array} shortlist The shortlist array
*/
function prepShortlist(shortlist) {

	// if the shortlist is undefined, we keep it that way
	if (shortlist === undefined) {
		return;
	}

	var output = [];

	for (var index = 0, length = shortlist.length; index < length; index++) {
		var item = shortlist[index];
		if (typeof item !== 'string') {
			item = item.toString();
		}
		output.push(item);
	}

	return output;
}

module.exports = {
	indexOf: indexOfId,
	listOf: listOfIds
};
