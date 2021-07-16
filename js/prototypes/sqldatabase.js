/**
 * define sqldatabase prototype
**/

var baseproto = require('./baseproto.js');

var sqldatabase = {
	_protoName : 'sqldatabase',

	// define sqldatabase object properties
	connection 			: 	null,				// holds the connection object to the SQL server or null if not connected
	eventEntryCreated	: 	false,				// flag indicating whether a SQL entry has been added (`events`) for current event
	hasData				:	false,				// flag indicating whether SQL database table contains any data
	isBusy 				: 	false, 				// flag indicating whether a SQL query is currently ongoing
	isConnected			: 	false,				// flag indicating whether a connection to SQL server has been established

	/**
	 * performs a query using the underlying database connection
	 *
	 * @param sqlQuery 	= {String} 		specifying SQL query to execute
	 * @param callback 	= {Function} 	to call after operation has completed successfully
	**/
	query : function(sqlQuery, callback) {
		throw "unimplemented query method";
	},

	/**
	 * deletes entries from table where whereLogic applies
	 *
	 * @param sqlTableName  	= {Object}		entry object from local 'database' object
	 * @param whereLogic 		= {String} 		containing equality to use to target the selection of a specific row
	 * @param callback 			= {Function} 	to call after operation has completed successfully
	 *
	 * for data protection, if @param whereLogic is 'null', nothing should be deleted / returned
	**/
	deleteFrom : function(sqlTableName, whereLogic, callback) {
		throw "unimplemented deleteFrom method";
	},

	/**
	 * safely closes the SQL server connection
	**/
	end : function() {
		throw "unimplemented end method";
	},

	/**
	 * inserts new entry to SQL database
	 *
	 * @param sqlTableName  	= {Object}		entry object from local 'database' object
	 * @param databaseColumns 	= {Array} 		containing names of SQL table columns to insert values into
	 * @param valuesToAdd		= {Array} 		containing entry values to add
	 * @param callback 			= {Function} 	to call after operation has completed successfully
	**/
	insertInto : function(sqlTableName, databaseColumns, valuesToAdd, callback) {
		throw "unimplemented insertInto method";
	},

	/**
	 * selects entries from table, using passed logic
	 *
	 * @param sqlTableName  	= {Object}		entry object from local 'database' object
	 * @param databaseColumns 	= {Array} 		containing names of SQL table columns to select
	 * @param whereLogic 		= {String} 		containing equality to use to target the selection of a specific row
	 * @param callback 			= {Function} 	to call after operation has completed successfully
	 *
	 * if @param whereLogic is 'null', all rows are selected and returned
	**/
	selectFrom : function(sqlTableName, databaseColumns, whereLogic, callback) {
		throw "unimplemented selectFrom method";
	},

	/**
	 * updates entry in database table, using passed logic
	 *
	 * @param sqlTableName  	= {Object}		entry object from local 'database' object
	 * @param databaseColumns 	= {Array} 		containing names of SQL table columns to update values
	 * @param updatedValues		= {Array} 		containing updated entry values
	 * @param whereLogic 		= {String} 		containing equality to use to target the update of a specific row
	 * @param callback 			= {Function} 	to call after operation has completed successfully
	**/
	update : function(sqlTableName, databaseColumns, updatedValues, whereLogic, callback) {
		throw "unimplemented update method";
	}

};

sqldatabase.__proto__ = baseproto;
module.exports = sqldatabase;