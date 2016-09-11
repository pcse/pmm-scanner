(function(window) {

var App = {
	doc:null,
	events:{
		resize:[]
	},
	audio: null,
	properties:{
		minDocumentHeight:500
	},
	addResizeListener:function(div,properties,ratio,main) {
		var self = this;
		ratio = ratio || 1;

		App.events.resize.push(function() {
			if(main) div.style[properties] = (window.innerHeight * ratio) >= self.properties.minDocumentHeight ? (window.innerHeight * ratio)+"px" : self.properties.minDocumentHeight+"px";
			else div.style[properties] = (window.innerHeight * ratio)+"px"
		});
	},

	/**
	 * Arrange and center elemens in the document relative to
	 * the current screen size.
	 * 
	 * @param doc = {Document} html native element containing the entire page
	 */
	resize:function(doc) {
		this.doc = doc;
		var mainPanel = doc.getElementById("main-panel");
		mainPanel.style.height = (window.innerHeight * 0.70)+"px";

		var editorPanel = doc.getElementById("editorPanel");
		editorPanel.style.height = (window.innerHeight * 0.11)+"px";

		this.addResizeListener(mainPanel, 'height', 0.60, true);
	},

	playAlert: function() {
		if(!App.audio) {
			App.audio = new Audio();
			App.audio.src = 'resources/alert.mp3';
		}

		if(App.audio.isPlaying) {
			App.audio.isPlaying = false;
			App.audio.pause();
			App.audio.currentTime = 0;
		}

		App.audio.isPlaying = true;
		App.audio.play();

	},

	init:function() {

	}
};

window.App = App;										// add object to global scope

})(window);

var events = {
	// contains names of events and corresponding callbacks
	_events:{},

	/**
	 * calls every function assigned for each event
	 *
	 * @eventName {String} key assigned to callback function array
	 * @paramArray {Array} an array of parameters to be passed to event callback when event is fired
	 */
	emit:function(eventName, paramArray) {
		// make sure an array has been initialized for current event key
		events._events[eventName] = events._events[eventName] || [];

		// call each of the event's callbacks
		events._events[eventName].forEach(function(e) {
			// call each event's callback
			e.apply(this, paramArray);
		});
	},

	/**
	 * adds callback to array list corresponding to event
	 *
	 * @eventName {String} key assigned to callback function array
	 * @paramArray {Array} an array of parameters to be passed to event callback when event is fired
	 */
	on:function(eventName, callback) {
		// check if event has been assigned before
		if(!events._events[eventName]) {
			// initialize array for new event
			events._events[eventName] = [];
		}

		// add callback to event callback array
		events._events[eventName].push(callback);
	}
};

/**
 * Calls functions in the App.events.resize[] Array any time
 * the window.resize event is emitted
 * 
 * @event resize
 */
window.addEventListener('resize', function() {
	// iterate through and call functions added to resize array
	App.events.resize.forEach(function(e) {
		// add scope of App to each function
		e.call(this);
	});
});

/**
 * Initiates application when all window elements have loaded.
 * 
 * @event load
 */
window.addEventListener('load', function() {
	// resize app to fit current window dimensions
	App.resize(document);

	var out = document.getElementById('out');				// define interface 'console' output for errors and alerts
	var sid = document.getElementById('sid-input');			// define variable to hold main scanner input element
	var statsOut = document.getElementById('stats1Out');
	
	window.addEventListener('keydown', function(e) {
		sid.focus();
		sid_handle_kbdevent(e);
	});

	// define main circle containing amount of current registrants
	var statsOutProgress = new ProgressBar.Circle('#stats1', {
		// circle loading bar properties
		color:'rgb(169,225,250)',
		duration:1200,
		easing:'easeIn',
		strokeWidth:1,
		trailColor:'rgba(255,255,255,0.1)'

	});

	// reset circle
	statsOutProgress.set(0);

	// define local data stats and counters
	var stats = {

		_init: false,

		total:0,
		registered:0,
		animationSettings: {
			duration: 800
		},

		// update ui
		refresh: function() {

			if(!stats._init) {
				stats._init = true;

				// add step function so animation recognizes new color-stop params
				stats.animationSettings.step = function(state, circle) {
					circle.path.setAttribute('stroke', state.color);
				}
			}

			if((stats.total / stats.average) >= 1) {
				stats.animationSettings.from 	= { color: '#cd3700' };
				stats.animationSettings.to 	= { color: '#cd3700' };
			} else {
				stats.animationSettings.from 	= { color: 'rgb(169,225,250)' };
				stats.animationSettings.to 	= { color: 'rgb(169,225,250)' };	
			}

			statsOutProgress.animate((stats.total / stats.average), stats.animationSettings, function() {
				sid.writeToStatsCounterOne((stats.total || ('' + stats.total)));
			});
		}
	};

	//focus the main input element
	sid.focus();

	sid.state = 1;										// 
	sid.dataState = null;								// (null, 0 ... 4) initialize dataState flag, used in 'registration'
														// process of a new entry to indicate which data to prompt the user for.

	/**
	 * Writes passed 'error message' to 'out' html element, or default
	 * error message if parameter is blank
	 * 
	 * @param err = {String} message containing error message to output to interface console
	 */
	sid.error = function(err) {
		sid.write(err || 'I couldn\'t understand that.');
	};

	/**
	 * Writes passed string to 'out' html element and resizes the 'out' element's
	 * top margin according to its new size containing the body of text passed.
	 * 
	 * @param text = {String} message containing text to output to interface console
	 */
	sid.write = function(text) {
		out.innerHTML = text || '';
	};

	/**
	 * Writes passed string to 'out' html element and resizes the 'out' element's
	 * top margin according to its new size containing the body of text passed.
	 * 
	 * @param text = {String} message containing text to output to interface console
	 */
	sid.writeToStatsCounterOne = function(text) {
		statsOut.innerHTML = text || '';
	};

	/**
	 * Sends passed string to server as a command
	 * 
	 * @param command = 	{String} 	message containing text to output to interface console
	 * @param callback = 	{Function} 	to call once response from Node.js server is received
	 */
	sid.command = function(command, callback) {

		var xhr = new XMLHttpRequest();
		xhr.open('POST','/command',true);
		xhr.send(command);

		xhr.addEventListener('readystatechange',function() {

			if(this.readyState == 4 && this.status == 200) {

				if(this.responseText == 'success') {
					callback.call(this);	
				} else {
					callback.call(this, this.responseText);
				}

			}

		});

	};

	/**
	 * init server requests to fetch previously obtained data for this event
	 */

	 // fetch current size of database
	 sid.command('/request/stats', function(data) {
	 	// emit event for when stats are received from our server
	 	events.emit('serverStatsReceived', [JSON.parse(data).data]);
	 });


	/**
	 * define user emitted events
	 */

	// event fires after a user is registered with the server's database
	events.on('register', function() {

		// update the counter of total people signed in
		stats.total++;
		stats.refresh();

	});

	// event fires after a response from server is received with statistical data
	events.on('serverStatsReceived', function(data) {
		stats.total = data.length; 
		stats.average = (data.stats.average || 100);
		stats.averageNew = data.stats.averageNew;
		stats.refresh();
	});

	/**
	 * Detects when a key is pressed while main input field
	 * is focused and calls anonymous function.
	 * 
	 * @event keydown
	 */
	function sid_handle_kbdevent(e) {
		
		if(e.keyCode == 13) {
			// if enter key is pressed
			sid.write('');

			if(sid.value == "") {
				sid.write((sid.state > 2 ? 'Please enter your name.' : 'Please enter your student ID.'));
			} else if(sid.state == 1 && sid.value.match(/^[a-z\ ]+/gi) && !sid.reg) {
				if(sid.value.match(/^(export|update|give|make|save|create)/gi) && !sid.value.match(/(["']+)/gi)) {
					if(sid.value.match(/(\ )+(csv)/gi)) {
						if(sid.temp = sid.value.match(/(emails|first names|ids|last names|fname(s|)|lname(s|))/gi)) {
							sid.write(sid.temp);
							// sid.command('/create/csv/'+sid.temp,function(err) {
							// 	if(err) {
							// 		return sid.write('There was an error creating a csv file from the requested data.');
							// 	}

							// 	sid.value = '';
							// 	sid.write('A comma-separated values file has been created from the requested data.');
							// });
						} else {
							sid.command('/export/csv',function(err) {
								if(err) {
									return sid.write('There was an error creating a CSV file from the data: '+err);
								}

								sid.value = '';
								sid.write('A CSV file has been created from the data.');
							});
						}
					} else if(sid.value.match(/(\ )+(db|mysql|sql|database)/gi) || !sid.value.match(/(\ )+(excel)/gi)) {
						sid.command('/export/mysql',function(err) {
							if(err) {
								return sid.write('There was an error updating the Excel spreadsheet.');
							}

							sid.value = '';
							sid.write('The data has been successfully exported.');
						});
					} else {
						sid.command('/export/excel',function(err) {
							if(err) {
								return sid.write('There was an error updating the Excel spreadsheet.');
							}

							sid.value = '';
							sid.write('The data has been successfully exported.');
						});
					}
				} else if(sid.value.match(/^(how)([a-z\ ]+)(people|students|persons)/gi)) {
					if(sid.value.match(/(new)/gi)) {
						sid.write(stats.registered+' new people have signed up so far.');
					} else if(sid.value.match(/(((are)([\ ]?)(there|here|present)|((have))([\ ]?)(come|arrived|shown up|shown|signed (up|in)|registered))|(\?|()))/gi)) {
						sid.write('There are currently '+stats.total+' people signed in.');
					} else {
						sid.error();
					}
					sid.value = '';
				} else if(sid.value.match(/^(I|())(\ )+([a-z\'\.\ ]+)(id)$/gi)) {
					sid.write('If you know your student ID, please type that in.');
				} else if(sid.value.match(/^(delete|remove|erase|undo)(\ )+(the|())([a-z0-9\ ]+)(people|entr(y|ies)|id(s|)|person(s|())|name(s|)|student(s|))(.*)/)) {
					if(sid.value.match(/(last|first|latest)([\ ]+)(two|three|four|five|six|seven|eight|nine|ten)?(\ )*(new)?(\ )*(person|student|name|entry|id)/gi)) {

						// send request to server to server to delete last added entry
						sid.command('/student/delete/last', function(err, data) {
							if(err) {
								// adverise error to client console
								console.log('The student requested could not be removed -> ' + err);

								// log error to gui console and exit function
								return sid.error(err);
							}

							stats.total--;
							stats.refresh();

							// log success to gui console
							sid.write('The last person signed in has been removed.');
						});
						
					} else if(sid.temp = sid.value.match(/((00|000)[0-9]{5,6})/gi)) {

						sid.command('/student/delete/' + sid.temp, function(err, data) {
							if(err) {
								// adverise error to client console
								console.log('The event requested could not be removed -> ' + err);

								// log error to gui console and exit function
								return sid.error(err);
							}

							stats.total--;
							stats.refresh();

							// log success to gui console
							sid.write('The student with id of "' + sid.temp + '" has been removed.');
						});

					} else {
						sid.error();
					}
				} else if(sid.value.match(/(set|event|name|speaker|company|talk|speech|presentation)/gi)) {
					if(sid.temp = sid.value.match(/(["']{1})([a-z\ 0-9\.\,\-\_\+\=\(\)\:\;\/\%\$\#\@\!\*]+)(["']{1})/gi)) {
						sid.command('/event/name/'+encodeURIComponent(sid.temp[0].substring(1,sid.temp[0].length-1)),function(err) {
							if(err) {
								return sid.error('The event\'s name could not be set: '+err);
							}

							sid.value = '';
							sid.write('This event\'s name has been set to '+sid.temp[0]);
						});
					} else {
						sid.error();
					}

				} else if(sid.value == 'fast reg on'){
					sid.fast_reg = true;
					sid.value = '';
					sid.write('Fast Registration Mode is ON');

				} else if(sid.value == 'fast reg off'){
					sid.fast_reg = false;
					sid.value = '';
					sid.write('Fast Registration Mode is OFF');

				} else {
					var xhr = new XMLHttpRequest();
					xhr.open('GET','http://navigator-fixed.rhcloud.com/apis/askcom/http://www.ask.com/web?q='+encodeURIComponent(sid.value.split('?')[0])+'&qsrc=0&o=0&l=dir',true);
					xhr.send();
					xhr.addEventListener('readystatechange',function() {
						if(this.readyState == 4 && this.status == 200) {
							
							var wrapper = document.createElement('div');
							wrapper.innerHTML = this.responseText;

							var found = false;

							var ansrs = wrapper.getElementsByClassName('tsrc_answ');
							var rsrs = wrapper.getElementsByClassName('rightrail-web-result-description');
							var wres = wrapper.getElementsByClassName('web-result-description');

							if((ansrs.length || rsrs.length) && wres.length && Math.round(Math.random() * 50) > 25) {
								found = true;
								answer = wres.item(Math.round(Math.random() * Math.min((wres.length - 1), 3))).innerHTML;
								answer = answer.split("\"\>\ More")[0];
							}

							if(found) return sid.write(answer);

							if(ansrs.length && rsrs.length) {
								found = true;
								if(Math.round(Math.random() * 10) > 5) {
									answer = ansrs.item(Math.round(Math.random() * (ansrs.length - 1))).children[1].children[1].innerHTML;
									answer = answer.split("\"\>Read\ More")[0];
								} else {
									answer = rsrs.item(Math.round(Math.random() * (rsrs.length - 1))).innerHTML;
								}
							}

							if(found) return sid.write(answer);

							if(ansrs.length) {
								answer = ansrs.item(Math.round(Math.random() * (ansrs.length - 1))).children[1].children[1].innerHTML;
								answer = answer.split("\"\>Read\ More")[0];
								found = true;
							}

							if(found) return sid.write(answer);

							if(rsrs.length) {
								answer = rsrs.item(Math.round(Math.random() * (rsrs.length - 1))).innerHTML;
								found = true;
							}

							if(found) return sid.write(answer);

							if(wres.length) {
								found = true;
								answer = wres.item(Math.round(Math.random() * Math.min((wres.length - 1), 3))).innerHTML;
								answer = answer.split("\"\>\ More")[0];
							}

							if(found) return sid.write(answer);

							sid.error();

						} else {
							sid.error();
						}
					});
				}
			} else {

				// strip first two numbers from student ID
				if(sid.value.match(/^20(00|000)[0-9]{5,6}/gi)) {
					sid.value = sid.value.substring(2, sid.value.length);
				}

				// if the registering-new-student 'reg' property is set on the input and value matches a string,
				// or if there is no 'reg' property set and the value matches a number (for a student id), continue
				if((!sid.reg && sid.value.match(/^(00|000)[0-9]{5,6}/gi)) || (sid.reg && sid.dataState != null)) {
					// if the 'register' flag is set, meaning we want to add a new entry and
					// that a dataState exists
					if(sid.reg && sid.dataState) {
						// check which 'input' stage the new user is on
						if(sid.dataState == 1) {
							// check to see that a first and last name are entered
							if(sid.value.match(/^[a-z\'\-]+(\ )[a-z\'\-]+/gi)) {
								// collect stuname and move on to next data state
								sid.dataState = 2;

								// parse first and last name from sid.value by splitting by spaces
								// and assigning values to sid.fname and sid.lname respectively
								sid.fname = sid.value.split(' ')[0];
								sid.lname = sid.value.split(' ')[1];

								// prompt student to enter the next dataState value (year)
								sid.placeholder = 'Enter graduating year to continue...';

								// reset input value
								sid.value = '';

							} else {
								// if an invalid name is entered, 
								sid.error('Please enter a valid name.');
							}
						} else if(sid.dataState == 2) {
							// collect year and move on to next data state
							sid.dataState = 3;

							// set sid.year to current sid value to save entered value (year)
							sid.year = sid.value;

							// prompt student to enter the next dataState value (major)
							sid.placeholder = 'Please enter your major...';

							// reset input value
							sid.value = '';

						} else if(sid.dataState == 3) {
							// collect 'major' and set dataState flag to 0. This tells the program
							// that the registration process is ending and must be reset.
							sid.dataState = 0;

							// set sid.major to current sid value to save entered value (major)
							sid.major = sid.value;

							// prompt student to enter the next dataState value (email)
							sid.placeholder = 'Finally, enter your email to sign in...';

							// reset input value
							sid.value = '';
						}

					} else {

						// store data to be sent as post request to server containing
						// entry information such as name, id, major, etc.
						var data = "id=" + sid.value;

						// default uri for logging already existing entries
						var uri = '/register';

						// if the 'reg' flag is set, but there is no dataState flag, or the dataState
						// flag is 0, this indicates the registration process has ended and must be reset.
						if(sid.reg && !sid.dataState) {
							// set sid.email to current sid value to save entered value (email)
							sid.email = sid.value;

							// reset input and placeholder values
							sid.value = '';
							sid.placeholder = 'Scan your ID';

							// format outgoing data string with new student information
							data = 	'student_id='	+ sid.sid 		+ 			// contains student id
									'&first=' 		+ sid.fname 	+ 			// contains student first name
									'&last='		+ sid.lname		+			// contains student last name
									'&year=' 		+ sid.year 		+			// contains student year
									'&major='		+ sid.major		+			// contains student major
									'&email='		+ sid.email 	;			// contains student email

							// update api request to register entry as new
							uri = '/register/new';

							// reset 'reg' flag to end registration mode and clear the 'sid' field of our input field object
							sid.reg = false;
							sid.sid = null;

							// clear dataState flag to indicate no registration prompt is going to be shown
							sid.dataState = null;

							// advertise registration was successful
							sid.write('You have been successfully registered!');

							// if information is entered successfully, update registrant counter
							stats.registered++;
						}

						// if program is no longer in 'registration' mode, send new data to the server
						var xhr = new XMLHttpRequest();
						xhr.open('POST', uri, true);
						xhr.send(data);
						xhr.addEventListener('readystatechange',function() {
							
							if(this.readyState == 4 && this.status == 200) {
								var student = JSON.parse(this.responseText);
								
								sid.state = 2; // state of 2 tells input field to reset its value

								// if the entry exists in the server 'database'
								if(student.registered) {
									// check if the entry has already been updated with the server
									if(student.alreadyRegistered) {
										// output message to the input field
										sid.value = 'You have already been signed in!';

										// output message to the interface console
										sid.error('You cannot register more than once per event.');
									} else {
										// output welcome message to the input field
										sid.value = 'Welcome, ' + student.fname + ' ' + student.lname;

										// broadcast 'register' event
										events.emit('register', [stats.total]);
									}
								} else {
									
									// if the Fast Registration flag is set
									if(sid.fast_reg) {
										

										// set all sid fields but id to "new_student" (manually correct these in database later)
										sid.fname		= 'new';
										sid.lname		= 'student';
										sid.major		= 'new_student';
										sid.year		= 'new_student';
										sid.email 		= 'new_student';
										sid.value 		= 'new_student'; 				// necessary because email gets overwritten with this

										sid.placeholder = 'Registering...';				// Please hold while we try to auto-register you.

										sid.dataState 	= 0;							// skip all the prompts for input
										sid.reg 		= true;							// but still register new user
										sid.sid 		= student.id;
										sid.state 		= 3;
										
										App.playAlert();


									} else {
										sid.value 		= '';						// reset our input value
										sid.placeholder = 							// sets input with instructions for user
										
											'Enter your name to continue...';

										sid.state 		= 3;						// state of '3' tells input field to reset its value
										sid.dataState 	= 1;
										sid.reg 		= true;						// tell app it is now in 'registration' mode
										sid.sid 		= student.id; 				// store student id in our main input field object

										// output registration message to the interface console
										sid.write('Welcome. Follow the steps above to register.');

										// play sound alert
										App.playAlert();
									}
								}
							}
						});
					}
				} else {
					if(!sid.reg) {
						sid.write('Please enter a valid student ID.');
					} else {	
						sid.write('Please enter your full name.');
					}
				}
			}
		} else if(e.keyCode == 27) {
			if(sid.reg) {
				sid.state = 1;
				sid.reg = false;
				sid.value = '';

				// output default message
				sid.placeholder = 'Type your ID to continue...';

				// clear input
				sid.write('');
			}
			sid.blur();
		} else {
			if(sid.state == 2) {
				// change input value type from 
				sid.state = 1;
				sid.value = '';
			} else if(sid.state == 3) {
				// clear student id input and set current input value
				// type to accept student's name
				sid.state = 1;
				sid.value = '';
			}			
		}
	} // sid_handle_kbdevent
});
