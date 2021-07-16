/**
 * define main app settings and methods
**/

var fs 		= require('fs');
var excel 	= require('excel');
var consts 	= require('./constants.js');

var _scanner = {

	event_id: consts.GLOBAL_DATE,
	event_name: consts.GLOBAL_DATE,

	// define fields, properties, and flags
	events : {}, // holds created event keys and associated callback functions in array values

	autosave: {
		setTimeout: null
	},

	/**
	 * 'emits' an app 'event' by calling all queued callback functions
	 * under that specific event's value array, using its name as key
	 *
	 * @param eventName = {String} containing name-key of event
	**/
	emit : function(eventName) {
		// check if event key has been initialized
		if(_scanner.events.eventName && _scanner.events.eventName.length) {
			// if event key has been created under events, and it contains functions, call them
			_scanner.events.eventName.forEach(function(action) {
				action.call(_scanner);
			});
		}
	},

	/**
	 * 'emits' an app 'event' by calling all queued callback functions
	 * under that specific event's value array, using its name as key
	 *
	 * @param eventName = {String} containing name-key of event
	 * @param callback = {Function} containing action to perform when event is emitted
	**/
	on : function(eventName, callback) {
		// check to see if event has been created before
		if(!_scanner.events.eventName) {
			// allocate new entry for eventName, and initialize its array value to hold functions
			_scanner.events.eventName = [];
		}

		// add callback function to list of functions to be called when event is emitted.
		_scanner.events.eventName.push(callback);
	},

	/**
	 * Checks that EXCEL_OUTPUT_FILE file exists and reads all fields from it.
	 * When file is parsed, it populates the 'database' object with data from its rows.
	 *
	 * @param callback 		 	= {Function} 	to be called when mysql database query is complete.
	 * @callback_param mysql 	= {JSONObject} 	providing 'this' context for callback function
	 * @callback_param err		= {String}		explaining error for unsuccessful connection to mysql server
	**/
	populateDatabaseFromMysql: function(scanner, db, rows, callback) {

			// iterate through rows array and add each row object to the database
			rows.forEach(function(row, index) {
				db.add(row);
			});

			// set flag for entry's existence in mysql server
			db.forEach(function(entry) {
				entry.existsInMysqlDatabase = true;
			});

			// tell program local database has data
			db.populated = true;

			// emit event to fire when database has been populated
			scanner.emit('databasepopulated');

			// call passed callback function
			callback.call(scanner);

	},

	syncAttendanceTableWithAPIServer: function(mysql, api, callback) {

		// get dataset containing hash of latest attendance result
		mysql.query('SELECT MD5(concat(student_id, event_id, is_new, COUNT(*))) AS md5, COUNT(*) AS total FROM `attendance` ORDER BY student_id DESC', function(err, rows) {

			if(err) {
				return console.log('API', 'SYNC', 'ERR', err);
			}

			api.send('eventdata', {
				attendanceHash: rows[0]
			}, function() {
				if(callback && typeof callback == 'function') {
					callback.call();
				}
			});

		});
	},

	/**
	 * Checks that EXCEL_OUTPUT_FILE file exists and reads all fields from it.
	 * When file is parsed, it populates the 'database' object with data from its rows.
	 *
	 * @param callback = {Function} to be called when excel sheet is done being read.
	**/
	populateDatabaseFromSpreadsheet: function(scanner, db, callback) {

		callback = callback || function() {};

		// check for individual event data
		var local_outputfile_exists = false;
		if(fs.existsSync(consts.EXCEL_RESULTS_DIR + scanner.getEventId() + '_' + consts.EXCEL_OUTPUT_FILE)) {
			local_outputfile_exists = true;
		}

		// checks if file exists
		if(!fs.existsSync(consts.EXCEL_RESULTS_DIR + consts.EXCEL_OUTPUT_FILE) && !local_outputfile_exists) {
			// define error message for no spreadsheet document found and exit
			var err = 'There is no database document present. Unable to proceed.';

			// call callback function and pass error message
			return callback.call(this, err);
		}

		// use excel package to read spreadsheet file
		excel((local_outputfile_exists ? consts.EXCEL_RESULTS_DIR + scanner.getEventId() + '_' + consts.EXCEL_OUTPUT_FILE : (consts.EXCEL_RESULTS_DIR + consts.EXCEL_OUTPUT_FILE)), function(err, data) {
		
			if(err) {
				// exit function and log error message to database.
				return console.log('Error reading spreadsheet file. -> '+err);
			}

			// loop through and add all rows (as arrays) from file to database
			for(var i = 1; i < data.length; i++) {
				db.add(data[i]);
			}

			// tell program local database has data
			db.populated = true;

			// emit event to fire when database has been populated
			scanner.emit('databasepopulated');

			// if callback function, call it with general context
			if(typeof callback == 'function') {
				callback.call(this);
			}

			// tell application, database has been populated
			// from the spreadsheet file.
			ready = true;

			// add plain array from file as backup data to database.
			db.setRawData(data);

			// Log to database that database has been populated and app is ready.
			if(local_outputfile_exists) {
				console.log('The local database has been populated from an existing spreadsheet (' + (scanner.getEventId() + '_' + EXCEL_OUTPUT_FILE) + ').');
			} else {
				console.log('The local database has been populated from spreadsheet.');
			}

		});
	},

	/**
	 * Takes the event's official name assigned by the user through the client, and 
	 * adds it to the mysql 'events' table, pairing it with the table's name (created using the scanner.getEventId()
	 * for such event.
	 *
	 * @param eventName	= {String} containing current event's name assigned through the client by user
	**/
	updateEventName: function(scanner, mysql, api, eventName) {

		if(!eventName || eventName == scanner.getEventName()) {
			return;
		}

		// now that a name for this event has been passed, assign in to our mysql object, if eventName is null or
		// undefined, use default name of scanner.getEventId().
		scanner.event_name = eventName;

		mysql.update(

			'events', 
			['event_name'], 
			[scanner.getEventName()], 

			// add 'where' conditional logic
			'table_name = "' + scanner.getEventId() + '"', 

			function(err) {
			
			if(err) {
				return console.log('An error occurred updating table name information in mysql server -> ' + err);
			}

			// log success
			if(scanner.getEventName() == scanner.getEventId()) {
				console.log('MYSQL', 'UPDATE', 'Successfully updated event entry ' + scanner.getEventId() + ' with statistical information.');
			} else {
				console.log('MYSQL', 'UPDATE', 'Successfully renamed event entry ' + scanner.getEventId() + ' to ' + scanner.getEventName() + ' in mysql events table.');
			}

		});

		api.send('eventdata', {
			eventname: scanner.getEventName()
		}, function() {
			console.log('API', 'Syncing event name with API server');
		});
	},

	exportDatabase: function(scanner, db, mysql, api, output, type, fname, callback) {

		// sync with api server, prevent queuing if server
		// is offline, this is so that if the server comes
		// back online, it is not spammed with 'export' requests
		if(api.isConnected()) {
			api.send('eventdata', {
				students: db.entries,
				attendance: db.attendance,
				eventname: scanner.getEventName()
			}, function() {
				console.log('API', 'Syncing database (students, attendance, eventname) entries with API server');
			});
		}


		if(typeof fname == 'function' && !callback) {
			callback = fname;
			fname = null;
		}

		if(!fname) {
			fname = consts.EXCEL_OUTPUT_FILE;
		}

		// save to individual file for current day - prevents destructive output
		fname = consts.EXCEL_RESULTS_DIR + scanner.getEventId() + '_' + consts.EXCEL_OUTPUT_FILE;

		if(type == 'excel' || !type || type == 'csv') {
			return output.generateCSVFromData(scanner, db, callback);
		} else if(type == 'mysql') {
			return output.generateMysqlSync(scanner, mysql, db, callback);
		} else {
			// exit and call callback function and pass err variable as first @param
			return callback.call(this, 'exportDatabase error: Invalid type.');
		}

	},

	setEventId: function(id) {
		_scanner.event_id = id;
	},

	getEventId: function() {
		return _scanner.event_id;
	},

	getEventName: function() {
		return _scanner.event_name;
	},

	init: function(eventId) {
		_scanner.event_id = eventId;
	},

	init_autosave: function(scanner, db, mysql, api, output, method) {

		clearTimeout(_scanner.autosave.setTimeout);
		_scanner.autosave.setTimeout = setTimeout(function() {
			_scanner.exportDatabase(scanner, db, mysql, api, output, method, consts.EXCEL_AUTOSAVE_FILE, function(err) {

				if(err) {
					return console.log('There was an error auto-saving to the database: ' + err);
				}

				console.log('AUTOSAVE', 'The database has been auto-saved using method \'' + method + '\'.');

				// set timeout of 60 seconds
				clearTimeout(_scanner.autosave.setTimeout);
				_scanner.autosave.setTimeout = setTimeout(function() {
					scanner.init_autosave.call(_scanner, scanner, db, mysql, api, output, method);
				}, (1000 * 60));

			});

		}, (1000 * 60));

	}

};

module.exports = _scanner;