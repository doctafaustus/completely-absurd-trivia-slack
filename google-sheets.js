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

      var userCellIndex = cells.findIndex(cell => cell.value === 'Jacob');
      //console.log(userCellIndex);

      var targetCell = cells[userCellIndex + 1];
      //console.log(targetCell);

      var targetCellValue = targetCell.value;

      targetCell.value = ++targetCellValue;
      targetCell.save(function() {
        console.log('Saved!');
      });
 
      // This should propbably be it's own function to specify parameters
      var lastCell = cells.find(cell => cell.value === '');
      lastCell.value = 'I AM LAST!';
      lastCell.save(function() {
        console.log('Saved!');
      })
      console.log(lastCell);


      step();
    });
  },
], function(err){
    if (err) {
      console.log('Error: '+err);
    }
});