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


var devURL = 'https://hooks.slack.com/services/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';
var prodSecretURL = 'https://hooks.slack.com/services/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';
var prodRealURL = 'https://hooks.slack.com/services/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';


var webhookURL = prodRealURL;

var questions = require('./questions/question-set-7');


// Trivia database API
// $.ajax({
// 	type: 'GET',
// 	url: 'https://opentdb.com/api.php?amount=10',
// 	success(data) {
// 		console.log(data);
// 	}
// })



class Game {
	constructor() {
		this.gameNum = Math.random().toString().substr(-6);
		this.users = [];
		this.currentQuestion = 0;
		this.stopped = false;
	}
}


class User {
	constructor(user) {
		this.name = user;
		this.score = 0;
		this.answer = null;
		this.wasCorrect = false;
		this.answerName = 'no answer';
	}
}


let game;


function checkAdmin(req, res, next) {
	if (req.body.user_name.indexOf('bill') === -1) {
		res.status(200).end();
  	var message = {
  		text: 'Ah ah ah! Only the admin can do that!',
  		replace_original: false,
  		response_type: 'ephemeral'
  	};
  	sendMessageToSlack(req.body.response_url, message);
	} else {
		next();
	}
}	


app.post('/new-trivia-game', urlencodedParser, checkAdmin, function(req, res) {
	console.log('/new-trivia-game');
	res.status(200).end();

	game = new Game();
	var message = {
		'attachments': [
	    {
				'text': `A new game has been created! (#${game.gameNum})\nWho would like to play?`,
				'callback_id': 'join_game',
				'color': '#2ea664',
				'attachment_type': 'default',
				'actions': [
					{
						'name': 'me',
						'text': 'Me!',
						'type': 'button',
						'value': 'me',
						'style': 'primary'
					}
				]
			}
		]
	};

  sendMessageToSlack(webhookURL, message);
});

app.post('/stop-trivia-game', urlencodedParser, checkAdmin, function(req, res) {
	console.log('/stop-trivia-game');
	res.status(200).end();
	if (game) {
		sendMessageToSlack(webhookURL, { text: `Game #${game.gameNum} cancelled by admin` });
		game.stopped = true;
	}
});


app.post('/start-trivia-game', urlencodedParser, checkAdmin, function(req, res) {
	console.log('/start-game');
	res.status(200).end();

	if (!game || !game.users || !game.users.length || game.gameEnded) {
		return sendMessageToSlack(webhookURL, { text: 'Users must join first before starting game' });
	}


	var list = game.users.map(user => {
		return `> *${user.name}*`;
	});
	list = list.join('\n');


	var message = {
		'attachments': [
			{
				'title': 'Players:',
				'pretext': 'All set! _Game starts in 5 seconds..._',
				'color': '#0086b3',
				'text': list,
				'mrkdwn_in': [
					'text',
					'pretext'
				]
			}
		]
	};

	sendMessageToSlack(webhookURL, message);

	setTimeout(sendQuestion, 5000);


});


app.post('/actions', urlencodedParser, function(req, res) {
	console.log('/actions');
  res.status(200).end();
  var actionJSONPayload = JSON.parse(req.body.payload);

  if (actionJSONPayload.callback_id === 'join_game') {

  	if (getUser(actionJSONPayload.user.name)) {
  		return console.log('User already registered')
  	}

  	var message = {
  		text: `_${actionJSONPayload.user.name} is in!_`
  	};
  	registerUser(actionJSONPayload.user.name);
  	console.log(game);
		sendMessageToSlack(webhookURL, message);
  }


  if (actionJSONPayload.callback_id === 'question_guess') {
  	var user = getUser(actionJSONPayload.user.name);
  	if (!user || user.answer) return;

  	// If answer is not contained in current question then do nothing
  	var currentQuestion = questions[game.currentQuestion];
  	var usersAnswer = actionJSONPayload.actions[0].name;


  	var propValues = [];
  	Object.keys(currentQuestion).forEach(function(key) {
  		var val = currentQuestion[key];
  		propValues.push(val);
  	});


  	if (propValues.indexOf(usersAnswer) === -1) {
  		console.log('Oops! something went wrong.');
  		return sendMessageToSlack(actionJSONPayload.response_url, { text: 'Oops! Something went wrong.', replace_original: false,
  		response_type: 'ephemeral' });
  	}

  	user.answer = actionJSONPayload.actions[0].value;
  	user.answerName = actionJSONPayload.actions[0].name;

  	var message = {
  		text: `_You answered *${actionJSONPayload.actions[0].name}*._`,
  		replace_original: false,
  		response_type: 'ephemeral'
  	};
  	sendMessageToSlack(actionJSONPayload.response_url, message);
  }
  
});


app.listen(process.env.PORT || 3000, function() {
	console.log('App listening on port 3000');
});



function sendMessageToSlack(responseURL, JSONmessage) {
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


function registerUser(username) {
	var user = new User(username);
	game.users.push(user);
}


function sendQuestion() {
	if (game.stopped) return;

	var questionObj = questions[game.currentQuestion];

    var message = {
      'attachments': [
        {
					'text': `${game.currentQuestion + 1}/${questions.length}: ${questionObj.question}`,
					'callback_id': 'question_guess',
					'color': '#fd00af',
					'attachment_type': 'default',
					'actions': [
						{
							'name': questionObj.a,
							'text': questionObj.a,
							'type': 'button',
							'value': 'a'
						},
						{
							'name': questionObj.b,
							'text': questionObj.b,
							'type': 'button',
							'value': 'b'
						},
						{
							'name': questionObj.c,
							'text': questionObj.c,
							'type': 'button',
							'value': 'c'
						},
						{
							'name': questionObj.d,
							'text': questionObj.d,
							'type': 'button',
							'value': 'd'
						}
					]
				}
			]
		};

	sendMessageToSlack(webhookURL, message);

	setTimeout(evaluateAnswers, 10000);

}



function evaluateAnswers() {
	if (game.stopped) return;

	var correctAnswer = questions[game.currentQuestion].answer;
	var correctAnswerText = questions[game.currentQuestion][correctAnswer];
	game.users.forEach(user => {
		if (user.answer === correctAnswer) {
			user.wasCorrect = true;
			user.score++;
		}
	});

	game.currentQuestion++;

	postQuestionResults(correctAnswerText);

}


function getUser(name) {
  return game.users.filter(function(v) {
    return v.name === name;
  })[0];
}


function postQuestionResults(correctAnswer) {

	var gameEnded = (game.currentQuestion === questions.length) ? true : false;


	var gotItRight;
	var correctUsers = [];
	game.users.forEach(user => {
		if (user.wasCorrect) {
			correctUsers.push(user.name);
		}
	});

	if (correctUsers.length) {
		gotItRight = `${correctUsers.join(', ')} got it right!`;
	} else {
		gotItRight = `No one got it right. You all suck.`;
	}

	if (!gameEnded) {
		gotItRight += ' _Next question in 8 seconds..._';
	}

	var title = (!gameEnded) ? '>*Leaderboard:*' : '>*GAME ENDED! - FINAL RESULTS:*';

	// Sort by score
	game.users.sort(function(a, b) {
		return b.score - a.score;
	});

	
	var list = game.users.map(user => {
		var guessedAnswer = user.answerName;
		return `     *${user.score}* ${user.name} (${guessedAnswer})`;
	});
	list = list.join('\n');
 
	var message = {
		text: `*Answer:* \`${correctAnswer}\`\n${gotItRight}\n${title}\n${list}`,
	}

	sendMessageToSlack(webhookURL, message);

	// Clear out results
	game.users.forEach(user => {
		user.wasCorrect = false;
		user.answer = null;
		user.answerName = 'no answer';
	});


	if (!gameEnded) {
		setTimeout(sendQuestion, 8000);
	} else {
		game.gameEnded = true;
	}
	
}