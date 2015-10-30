'use strict';

var express = require('express.io'),
		app = express(),
		bcrypt = require('bcrypt-nodejs'),
    bodyParser = require('body-parser'),
		mysql = require('mysql'),
		settings = {
			serverName: 'Emailr',
			host: 'localhost',
			port: process.env.PORT || 3011
		};

// setup public folder as static file serving location
app.use(express.static('server-static'));
app.use(bodyParser());

function connectToDB(){
	return mysql.createConnection({
		host     : '192.185.35.74',
		user     : 'pmphotog_emailer',
		password : 'emailLister2015',
		database : 'pmphotog_main'
	});
};

function generateSignatureContent(req, pwdHash, callback){
		callback = callback || function(){};
		var tolerance = 5;


	var timeMod = (tolerance * 60) * 2; // seconds, then in either direction
	var timestamp = Math.floor((new Date).getTime()/timeMod);
	//console.log(timestamp, req.originalUrl.substr(0, req.originalUrl.length-60), req.query.username, pwdHash);
	var hashContent = req.query.username + pwdHash;
	bcrypt.hash(hashContent, null, null, function(err,hash){
		callback(req.originalUrl.substr(0, req.originalUrl.length-60) + hash + timestamp);
	});

};

function generateSignature(req, pwdHash, callback){
	callback = callback || function(){};
	var tolerance = 5;

	generateSignatureContent(req, pwdHash, function(content){
		bcrypt.hash(content,null, null,callback);
	});
}

function checkParams(req){
	if(typeof req.query.username == 'undefined' || typeof req.query.signature == 'undefined'){
		return false
	}
	return true;
}

function validateSignature(req, callback, errCallback){
	if(checkParams(req)){
		// connect to logging db
		var mysql_connection = connectToDB();
		console.log(req.query.username,'SELECT * FROM `users` WHERE username=\''+req.query.username+'\'');
		mysql_connection.connect();
		mysql_connection.query("SELECT * FROM `users` WHERE username='"+req.query.username+"'", function (error, results, fields) {
			if(results.length == 1){
				generateSignatureContent(req, results[0]['password'], function(newSig){
					var requestSig = req.query.signature;
					requestSig = '$2a' + requestSig.substr(2);
					bcrypt.compare(newSig, requestSig, function(err, status){
						console.log(status);
						console.log(err);
						if(status){
							callback();
						}else{
							var errorReturn = {
								'number': 401,
								'name': 'Not Authorized',
								'message': 'This function requires authorization'
							};
							if(err !== null){
								var temperror = errorReturn;
								errorReturn = {'error1':temperror};
								errorReturn['error2'] = {
									'number': 512,
									'name': 'Encryption Error',
									'message': err
								};
							}
							errCallback(errorReturn);
						}
					}); //hash equals our hash
				});
			}
		});
		mysql_connection.end();
	}else{
		var errorReturn = {
				'number': 400,
				'name': 'Invalid Parameters',
				'message': 'This function requires authorization parameters'
			};
		errCallback(errorReturn);
	}
}

function sendError(err, res){
	var resp = {'success':false,'error':err};
	res.send(resp);
}

app.get('/auth', function(req, res){
	validateSignature(req, function(){
		res.send({'success':true});
	},
	function(error){
		sendError(error, res);
	});
});

app.get('/emails', function(req, res){
	// connect to logging db
	validateSignature(req, function(){

			var mysql_connection = connectToDB();

			mysql_connection.connect();
			mysql_connection.query('SELECT * FROM `email_list`', function (error, results, fields) {
				res.send(results);
			});
				mysql_connection.end();
	}, function(err){
		sendError(err,res);
	});
});

app.get('/emails/:id', function (req, res){
		// connect to logging db
	validateSignature(req, function(){
		var mysql_connection = connectToDB();

		mysql_connection.connect();
		mysql_connection.query('SELECT * FROM `email_list` WHERE id='+req.params.id, function (error, results, fields) {
			res.send(results);
		});
		mysql_connection.end();
	}, function(err){
		sendError(err,res);
	});
});

app.post('/emails', function(req, res){
	// convert php logic to here
	var error = {'success':false, 'error':{
		'number': 501,
		'name': 'Not Implemented',
		'message': 'This function is not yet implemented'
	}}
    res.send(error);
});

// default route
app.get('/', function (req, res) {
	res.sendfile('server-static/index.html');
});

var server = app.listen(settings.port, function () {
  console.log(settings.serverName + ' Backend Server listening at http://%s:%s', settings.host, settings.port);
});
