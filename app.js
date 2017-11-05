var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');


var app = express();
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));
app.use(bodyParser.json({limit: '1mb'}));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');


app.get('/', function(req, res){
  	console.log('test!');
  	res.sendStatus(200);
});


app.listen(process.env.PORT || 3000, function() {
	console.log('App listening on port 3000');
});