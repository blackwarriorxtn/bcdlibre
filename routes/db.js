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

var form_ignore_fields = [
  "OK",
  "CANCEL"
];

var insert_record = function(req, res, next, objFormParameters)
{
  // Must be something in the body
  if (!req.body) return res.sendStatus(400);

  var objSQLConnection = new_connection();
/* DEBUG
  res.setHeader('Content-Type', 'text/plain');
  res.write('you posted:\n');
  res.end(JSON.stringify(req.body, null, 2));
*/
/* DEBUG */

  var arrSQLNames = new Array();
  var arrSQLValues = new Array();
  for (var strSentName in req.body)
  {
    // DEBUG console.log("strSentName=\""+strSentName+"\"\n");
    // Dont look for excluded fields, like "OK" or "CANCEL"
    if (form_ignore_fields.indexOf(strSentName) == -1)
    {
      var objField = null;
      for (var intField = 0; intField < objFormParameters.fields.length; intField++)
      {
        var strFieldName = objFormParameters.fields[intField].name;
        if (strFieldName)
        {
          // DEBUG console.log("strFieldName=\""+strFieldName+"\"\n");
          if (strSentName == strFieldName.valueOf())
          {
            // Known field : store attributes to check value and prepare storage
            objField = objFormParameters.fields[intField];
          } // if (strSentName == strFieldName.valueOf())
        } // if (strFieldName)
      } // for (var intField = 0; intField < objFormParameters.fields; intField++)
      if (objField == null)
      {
        // Unknown field: error!
        throw new Error("ERROR: field \""+strSentName+"\" is unknown!");
      } // if (objField == null)
      else
      {
        var strSQLValue = check_field_value(req.body[strSentName],objField,objSQLConnection);
        arrSQLNames.push(objSQLConnection.escapeId(objField.name)); // TODO handle name translation from HTML FORM to SQL TABLE COLUMN
        arrSQLValues.push(strSQLValue);
      } // else if (objField == null)
    } // if (form_ignore_fields.indexOf(strSentName) == -1)
  } // for (var objField in req.body)

  var strSQL = "INSERT INTO "+objSQLConnection.escapeId(objFormParameters.table_name)+"("+arrSQLNames.join(",")+")\n"
             + "VALUES("+arrSQLValues.join(",")+")\n"
             + ";"
             ;
  // DEBUG
  console.log(strSQL);

  runsql(strSQL, function(err, rows, fields) {
    // TODO handle duplicate key errors (login must be unique but it is provided by user)
    if (err) throw err;
    res.redirect('list'); // TODO res.redirect('view')
  });
}

var view_record = function(req, res, next, objFormParameters, fnCallback)
{
  // Must be something in the query (GET)
  if (!req.query) return res.sendStatus(400);

  var objSQLConnection = new_connection();

  // DEBUG
  console.log("primary_key=%j\n",objFormParameters.primary_key);
  console.log("req.body=%j\n",req.body);
  console.log("req.query=%j\n",req.query);

  // Get primary key of form
  var arrSQLPKNamesEqualValues = new Array();
  for (var intPK = 0; intPK < objFormParameters.primary_key.length; intPK++)
  {
    var strPKName = objFormParameters.primary_key[intPK];
    // DEBUG
    console.log("strPKName=%s\n",strPKName);
    if (strPKName)
    {
      // Check that this field has been sent in request
      if (req.query[strPKName])
      {
        var strSQLNameEqualValue = objSQLConnection.escapeId(strPKName) + " = " + objSQLConnection.escape(req.query[strPKName]);
        arrSQLPKNamesEqualValues.push(strSQLNameEqualValue);
      }
      else
      {
        throw new Error("Can't find parameter \""+strPKName+"\" in request");
      }
    } // if (strPKName)
  } // for (var intPK = 0; intPK < objFormParameters.primary_key.length; intPK++)

  var strSQL = "SELECT * FROM "+objSQLConnection.escapeId(objFormParameters.table_name)+"\n"
             + "WHERE "+arrSQLPKNamesEqualValues.join("\n AND ")+"\n;"
             ;
  // DEBUG
  console.log(strSQL);

  runsql(strSQL, function(err, rows, fields) {
    fnCallback(err, rows, fields);
  });
}

module.exports.new_connection = new_connection;
module.exports.runsql = runsql;
module.exports.check_field_value = check_field_value;
module.exports.form_ignore_fields = form_ignore_fields;
module.exports.insert_record = insert_record;
module.exports.view_record = view_record;
