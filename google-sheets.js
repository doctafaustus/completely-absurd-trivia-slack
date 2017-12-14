var GoogleSpreadsheet = require('google-spreadsheet');
var async = require('async');
 
var doc = new GoogleSpreadsheet('1zaVNGbEm3Tma4c-IxGOUa687Gpuw3sKXYXW4-6IEAOA');
var sheet;
 
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
      'max-row': 10,
      'min-col': 1,
      'max-col': 2,
      'return-empty': true
    }, function(err, cells) {

      var users = [
        { name: 'Jacob' },
        { name: 'Alex' },
        { name: 'Rob' },
        { name: 'John' },
        { name: 'Bob' }
      ];

      var namesToAdd = [];
      var counter = 0;
      users.forEach(({ name }) => {
        var userCellIndex = cells.findIndex(cell => cell.value === name);
        if (userCellIndex === -1) {
          namesToAdd.push(name);
        }
      });


      if (namesToAdd.length) {
        var firstColumnCells = cells.filter(cell => cell.batchId.indexOf('C1') > -1);
        namesToAdd.forEach((name) => {
          var lastCell = firstColumnCells.find(cell => cell.value === '');
          lastCell.value = name;
          lastCell.save(function() {
            counter++;
            if (counter === namesToAdd.length) {
              updateWins();
            }
          });
        });
      } else {
        updateWins();
      }


      function updateWins() {
        users.forEach((user) => {
          var userCellIndex = cells.findIndex(cell => cell.value === user.name);
          var winsCell = cells[userCellIndex + 1];
          var targetCellValue = winsCell.value;

          winsCell.value = ++targetCellValue;
          winsCell.save();
        });
      }

      step();
    });
  },
], function(err){
    if (err) {
      console.log('Error: '+err);
    }
});