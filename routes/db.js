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

var check_field_value = function(strValue, arrFieldDescription)
{
  var strSQLValue = null;
  // TODO Implement
  strSQLValue = new String(strValue);
  return(strSQLValue);
}

module.exports.runsql = runsql;
module.exports.check_field_value = check_field_value;
