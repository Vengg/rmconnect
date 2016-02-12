var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var soap = require('soap');

var routes = require('./routes/index');
var users = require('./routes/users');
var url = "https://captchaservice.rentmanager.com/CaptchaService.asmx?WSDL";

var app = express();

//set port for Heroku
var port = process.env.PORT || 8080;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

var captchaParams = {BackColor: 'white', 
					BackgroundNoise: 'Low', 
					FontName: 'Times New Roman', 
					FontSize: 30, 
					FontStyle: 'Bold',
					FontWarp: 'Low', 
					ForeColor: 'black', 
					LineNoise: 'NotSet', 
					TextLength: 6};


var CreateParameters = {parameters: captchaParams};


app.get('/soap', function(req, res){
	var result;
	
	soap.createClient(url, function(err, client) {
		client.CaptchaService.CaptchaServiceSoap12.Create(CreateParameters, function(err, result) {
				console.log(result);
				console.log(client.describe());
				res.json(result);	
			});			
	});
	
	app.render('results', {
		title: 'Respond'
		
	});
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});






module.exports = app;