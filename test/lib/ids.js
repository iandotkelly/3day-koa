/**
 * @description Test for the ids module
 *
 * @author Ian Kelly
 */

'use strict';

require('should');
var ObjectId = require('mongoose').Types.ObjectId;
var indexOf = require('../../lib/ids').indexOf;
var listOf = require('../../lib/ids').listOf;

describe('indexOf', function() {

	describe('if not passed an array', function() {
		it('should throw an exception', function() {
			/*jshint -W068, strict: true */
			(function() {
				indexOf();
			}).should.throw ();
		});
	});

	describe('if not passed an id', function() {
		it('should throw an exception', function() {
			/*jshint -W068, strict: true  */
			(function() {
				indexOf([]);
			}).should.throw ();
		});
	});

	describe('if passed an array with no ids', function() {
		it('should return -1', function() {
			indexOf([1,2,3,4], 1).should.be.equal(-1);
		});
	});

	describe('if passed an array with ids, but no matching id', function() {
		it('should return -1', function() {
			indexOf([{id:1},{id:2},{id:3},{id:4}], 5).should.be.equal(-1);
		});
	});

	describe('if passed an array with ids, but no matching id of the correct type', function() {
		it('should return -1', function() {
			indexOf([{id:'1'},{id:'2'},{id:'3'},{id:'4'}], 2).should.be.equal(-1);
		});
	});

	describe('if passed an array with ids, and with a matching id should return the correct index', function() {
		it('should return the correct index', function() {
			indexOf([{id:'1'},{id:'2'},{id:'3'},{id:'4'}], '1').should.be.equal(0);
			indexOf([{id:'1'},{id:'2'},{id:'3'},{id:'4'}], '2').should.be.equal(1);
			indexOf([{id:'1'},{id:'2'},{id:'3'},{id:'4'}], '3').should.be.equal(2);
			indexOf([{id:'1'},{id:'2'},{id:'3'},{id:'4'}], '4').should.be.equal(3);
		});
	});

	describe('if passed an array with ObjectId, and with a matching ObjectId should return the correct index', function() {
		it('should return the correct index', function() {
			var array = [];
			array.push({id: new ObjectId()});
			array.push({id:new ObjectId()});
			array.push({id:new ObjectId()});
			array.push({id:new ObjectId()});
			var item = new ObjectId(array[1].id);
			indexOf(array, item).should.be.equal(1);
		});
	});
});


describe('listOf', function() {

	describe('if not passed an array', function() {
		it('should throw', function() {
            /* jshint -W068, strict: true  */
            (function () {
                listOf();
            }).should.throw;
		});
	});

	describe('if passed an array with no ids', function() {
		it('should return an empty array', function() {
			var result = listOf([1,2,3,4]);
			result.should.be.an.Array();
			result.length.should.be.equal(0);
		});
	});

	describe('if passed an incomplete list of ids', function() {
		it('should return what ids are found', function() {
			var result = listOf([{id:1},{id:2},3,{id:4}]);
			result.should.be.an.Array();
			result.length.should.be.equal(3);
			result[0].should.be.equal(1);
			result[1].should.be.equal(2);
			result[2].should.be.equal(4);
		});
	});

	describe('if passed an full list of ids', function() {
		it('should return what ids are found', function() {
			var result = listOf([{id:1},{id:2},{id:3},{id:4}]);
			result.should.be.an.Array();
			result.length.should.be.equal(4);
			result[0].should.be.equal(1);
			result[1].should.be.equal(2);
			result[2].should.be.equal(3);
			result[3].should.be.equal(4);
		});
	});

	describe('if passed an duplicate ids', function() {
		it('should return only unique ids', function() {
			var result = listOf([{id:1},{id:2},{id:3},{id:4},{id:3}]);
			result.should.be.an.Array();
			result.length.should.be.equal(4);
			result[0].should.be.equal(1);
			result[1].should.be.equal(2);
			result[2].should.be.equal(3);
			result[3].should.be.equal(4);
		});
	});
});
