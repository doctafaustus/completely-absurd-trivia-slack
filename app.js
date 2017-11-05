var express = require('express');
var request = require('request');
var bodyParser = require('body-parser');


var app = express();
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb' }));
app.use(bodyParser.json({limit: '1mb'}));
app.use(express.static(__dirname + '/public'));
app.set('view engine', 'ejs');
var urlencodedParser = bodyParser.urlencoded({ extended: false });


app.get('/', function(req, res){
  	console.log('test!');
  	res.sendStatus(200);
});


app.post('/send-me-buttons', urlencodedParser, function(req, res) {
	console.log('hello hello hello');

	res.status(200).end();
  var responseURL = req.body.response_url;
  if (req.body.token !== 'cO4xREzAYlC5Om1axiIUl0Ml') {
    res.status(403).end('Access forbidden');
  } else {
    var message = {
      'text': 'This is your first interactive message',
      'attachments': [
        {
					'text': 'Building buttons is easy right?',
					'fallback': 'Shame... buttons aren\'t supported in this land',
					'callback_id': 'button_tutorial',
					'color': '#3AA3E3',
					'attachment_type': 'default',
					'actions': [
						{
							'name': 'yes',
							'text': 'yes',
							"type": 'button',
							'value': 'yes'
						},
						{
							'name': 'no',
							'text': 'no',
							'type': 'button',
							'value': 'no'
						},
						{
							'name': 'maybe',
							'text': 'maybe',
							'type': 'button',
							'value': 'maybe',
							'style': 'danger'
						}
					]
				}
			]
		};

    sendMessageToSlackResponseURL(responseURL, message)
  }
});

app.post('/actions', urlencodedParser, function(req, res) {
  res.status(200).end();
  var actionJSONPayload = JSON.parse(req.body.payload);
  var message = {
    'text': actionJSONPayload.user.name + ' clicked: ' +actionJSONPayload.actions[0].name,
      'replace_original': false
  }

  sendMessageToSlackResponseURL(actionJSONPayload.response_url, message);
});


app.listen(process.env.PORT || 3000, function() {
	console.log('App listening on port 3000');
});



function sendMessageToSlackResponseURL(responseURL, JSONmessage) {
	var postOptions = {
		uri: responseURL,
		method: 'POST',
		headers: {
			'Content-type': 'application/json'
		},
		json: JSONmessage
	};

	request(postOptions, function(error, response, body) {
		if (error) throw error;
	});
}
