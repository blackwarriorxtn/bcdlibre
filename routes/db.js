var mysql = require('mysql');
var runsql = function (strSQL, fnCallback)
{
  var connection = mysql.createConnection({
    host     : 'localhost',
    user     : 'bibliopuce',
    database : 'bibliopuce',
    password : 'FPxWFYVux7BhEuU9' /* TODO Use crypted configuration */
  });

  connection.connect();

  connection.query(strSQL, fnCallback);

  connection.end();
}

module.exports.runsql = runsql;
