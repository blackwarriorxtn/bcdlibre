var mysql = require('mysql');


var strMySQLHost = 'localhost';
var strMySQLDatabase = 'bibliopuce';
var strMySQLUser = 'bibliopuce';
var strMySQLPassword = 'FPxWFYVux7BhEuU9'; /* TODO Use crypted configuration */

var new_connection = function ()
{
  var objSQLConnection= mysql.createConnection({
      host     : strMySQLHost,
      user     : strMySQLUser,
      database : strMySQLDatabase,
      password : strMySQLPassword
    });
  objSQLConnection.connect();
  return(objSQLConnection);
}

var runsql = function (strSQL, fnCallback, objSQLConnection)
{
  var blnMustDisconnect = false;
  if (objSQLConnection == null)
  {
    objSQLConnection= new_connection();
    blnMustDisconnect = true;
  }

  objSQLConnection.query(strSQL, fnCallback);

  if (blnMustDisconnect)
  {
    objSQLConnection.end();
  }
}

var check_field_value = function(strValue, arrFieldDescription, objSQLConnection)
{
  var strSQLValue = null;
  var blnMustDisconnect = false;
  if (objSQLConnection == null)
  {
    objSQLConnection= new_connection();
    blnMustDisconnect = true;
  }
  // Use the SQL connection to escape value with appropriate charset/encoding
  strSQLValue = objSQLConnection.escape(strValue);
  if (blnMustDisconnect)
  {
    objSQLConnection.end();
  }
  return(strSQLValue);
}

var arrExceptFields = [
  "OK",
  "CANCEL"
];


module.exports.new_connection = new_connection;
module.exports.runsql = runsql;
module.exports.check_field_value = check_field_value;
module.exports.form_ignore_fields = arrExceptFields;
