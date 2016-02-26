var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var soap = require('soap');
var cors = require('cors');
var request = require('request');

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
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

//set captch paramaters
var captchaParams = {BackColor: 'white', 
					BackgroundNoise: 'Low', 
					FontName: 'Times New Roman', 
					FontSize: 30, 
					FontStyle: 'Bold',
					FontWarp: 'Low', 
					ForeColor: 'black', 
					LineNoise: 'NotSet', 
					NoiseColor: 'orange',
					TextLength: 6};


//format paramaters for SOAP					
var CreateParameters = {parameters: captchaParams};

app.use(cors());

var client;
soap.createClient(url, function(err, newClient) {
    if (err) {
        // Shut down the server, all is lost.
    }
 
    client = newClient;
});
 
app.get('/captcha', cors(), function(req, res, next){
    client.CaptchaService.CaptchaServiceSoap12.Create(CreateParameters, function(err, result) {
        if (err) {
            next(err);
        }
 
        var captchaKey = result["CreateResult"];
        client.CaptchaService.CaptchaServiceSoap12.GetImageUrl({'key': captchaKey}, function(err, result) {
            if (err) {
                next(err);
            }
 
            res.json({imglnk: result["GetImageUrlResult"], key: captchaKey});
            });
        });
  });

app.post('/formSend', function(req, res) {
	console.log("I'm Here");
	var fwdurl = req.pipe(request.post("https://applicationgateway.rentmanager.com/WebApplicationHandler.aspx", function (err, response, body){
			if (err) {
				next(err)
			}
			else {
				console.log("This is the Body");
				console.log(body);
				if(response.statusCode == 302){
						res.send('<style>p{font-size: 20px;} h1{font-size: 22px; font-weight: bold; padding: 6px 0;}</style>' +
						'<h1>Application Submitted Successfully!</h1>' +
						'<p>In order to process your application we require a $45 application fee per applicant and cosigner</p>' +
						'<p>Would you like to pay the application fee online? Select an option below:</p>' +
						'<p>$45 - 1 applicant</p>' +
						'<form name="PrePage" method = "post" action = "https://Simplecheckout.authorize.net/payment/CatalogPayment.aspx">' +
						'<input type = "hidden" name = "LinkId" value ="eedfd428-6f77-4433-bea6-3cc74af9b482" />' +
						'<input type = "submit" value = "Pay $45" />' +
						'</form>' +
						'<hr>' +
						'<p>$90 - 1 applicant and 1 cosinger</p>' +
						'<form name="PrePage" method = "post" action = "https://Simplecheckout.authorize.net/payment/CatalogPayment.aspx">' +
						'<input type = "hidden" name = "LinkId" value ="dc33e526-bbef-4891-b97a-b944b16af3ae" />' +
						'<input type = "submit" value = "Pay $90" />' +
						'</form>' +
						'<p><b><i>A fee is required for each applicant and any cosigner.</i></b></p>' +
						'<hr>' +
						'<p>If you would like to complete the application and send in your payment via another method please contact Richmond Loft Company and make arrangments </p>' +
						'<p>PLEASE NOTE YOUR APPLICATION WILL NOT BE PROCESSED UNTIL THE FEE HAS BEEN PAID.</p>' +
						'<div><!-- (c) 2005, 2012. Authorize.Net is a registered trademark of CyberSource Corporation -->' +
						'<div class="AuthorizeNetSeal">' +
						'<script type="text/javascript" language="javascript">var ANS_customer_id="ba4cc285-a204-4c0d-8034-7b1be7d674ca";</script>' +
						'<hr>' +
						'<script type="text/javascript" language="javascript" src="//verify.authorize.net/anetseal/seal.js" ></script>' +
						'<a href="http://www.authorize.net/" id="AuthorizeNetText" target="_blank">Web Ecommerce</a></div>' +
						'<p dir="ltr">&nbsp;</p>' +
						'</div>');
				}
				else {
					var errMessage = body.toString().match(/errormessage' value='(.{7})/)[1];
					console.log(errMessage);
				}		
			}
		});
	);
	console.log("This is what is being sent back");
	console.log(res.body);
	fwdurl.pipe(res);
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
