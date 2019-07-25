var async = require('async');
var GoogleSpreadsheet = require('google-spreadsheet');

// Link to leaderboard spreadsheet: https://docs.google.com/spreadsheets/d/117yGWvkjZvngoFtzwwHpqOqwY9IyFnbbMtaB8gBm5w8/edit#gid=0
var doc = new GoogleSpreadsheet('1zaVNGbEm3Tma4c-IxGOUa687Gpuw3sKXYXW4-6IEAOA');
var sheet;



function getLeaderboard(cb) {
  async.series([

    function setAuth(step) {
      var creds = require('./credentials.json');
      doc.useServiceAccountAuth(creds, step);
    },

    function getInfoAndWorksheets(step) {
      doc.getInfo(function(err, info) {
        console.log('Loaded doc: '+info.title+' by '+info.author.email);
        sheet = info.worksheets[0];
        console.log('sheet 1: '+sheet.title+' '+sheet.rowCount+'x'+sheet.colCount);
        step();
      });
    },

    function workingWithCells(step) {
      sheet.getCells({
        'min-row': 1,
        'max-row': 100,
        'min-col': 1,
        'max-col': 2,
        'return-empty': true
      }, function(err, cells) {

        var relevantCells = cells.filter(cell => {
          return cell.value !== 'Player' && cell.value !== 'Wins' && cell.value.length
        });

        var leaders = [];
        relevantCells.forEach((cell, index) => {
          var entry = {};

          if (cell.col === 1) {
            entry.name = cell.value;
            entry.score = +relevantCells[index+1].value;
            leaders.push(entry);
          }
        });


        leaders = leaders.sort(function(a, b) {
          return b.score - a.score
        });

        cb(leaders);

        step();
      });
    },
  ], function(err){
      if (err) {
        console.log('Error: '+err);
      }
  });
}


module.exports = getLeaderboard;