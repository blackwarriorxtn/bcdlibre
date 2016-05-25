var mysql = require('mysql');
var config = require('../setup/config.js');

var strMySQLHost = config.database.host_name;
var strMySQLDatabase = config.database.database_name;
var strMySQLUser = config.database.application_user_name;
var strMySQLPassword = config.database.application_user_password;

/**
 * You first need to create a formatting function to pad numbers to two digits…
 **/
function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
}

/**
 * …and then create the method to output the date string as desired.
 * Some people hate using prototypes this way, but if you are going
 * to apply this to more than one Date object, having it as a prototype
 * makes sense.
 **/
Date.prototype.toSQL = function() {
    return this.getFullYear() + "-" + twoDigits(1 + this.getMonth()) + "-" + twoDigits(this.getDate()) + " " + twoDigits(this.getHours()) + ":" + twoDigits(this.getMinutes()) + ":" + twoDigits(this.getSeconds());
};

var new_connection = function ()
{
  var objSQLConnection= mysql.createConnection({
      host     : strMySQLHost,
      user     : strMySQLUser,
      database : strMySQLDatabase,
      password : strMySQLPassword,
      multipleStatements: true
    });
  objSQLConnection.connect();
  return(objSQLConnection);
}

var runsql = function (objSQL, fnCallback, objSQLConnection)
{
  var blnMustDisconnect = false;
  if (objSQLConnection == null)
  {
    // DEBUG
    console.log("Opening new connection...");
    objSQLConnection= new_connection();
    blnMustDisconnect = true;
  }

  var strSQL = null;
  if (Array.isArray(objSQL))
  {
    strSQL = objSQL.join("\n");
  }
  else
  {
    strSQL = objSQL;
  }
  // DEBUG
  console.log("SQL:\n%s\n", strSQL);
  objSQLConnection.query(strSQL, fnCallback);

  if (blnMustDisconnect)
  {
    objSQLConnection.end();
  }
}

var check_field_value = function(strValue, objFieldDescription, objSQLConnection, req)
{
  var strSQLValue = null;
  var objValue = strValue;
  var blnEscapeString = true;
  var blnMustDisconnect = false;
  if (objSQLConnection == null)
  {
    objSQLConnection= new_connection();
    blnMustDisconnect = true;
  }


  console.log("check_field_value(strValue=\"%s\", objFieldDescription: %j ...)", strValue, objFieldDescription);

  // TODO Convert value according to type
  if (objFieldDescription.type != null)
  {
    switch (objFieldDescription.type.valueOf())
    {
      case "Date":
      // TODO Conversion
      break;

      case "DateTime":
      // TODO Conversion
      break;

      case "Integer":
        // Conversion : string to integer
        if (strValue != null)
        {
          // Use regexp to check content
          var objNumbers = strValue.match(/^[-+]?\d+$/);
          if (objNumbers == null)
          {
            objValue = null;
          }
          else
          {
            if (objNumbers[0] == strValue.valueOf())
            {
              var intValue = new Number(objNumbers[0]);
              if (isNaN(intValue))
              {
                objValue = null;
              }
              else
              {
                // DEBUG
                console.log("Conversion: value=%d",intValue);
                // Store integer value
                blnEscapeString = false;
                objValue = intValue;
              }
            }
            else
            {
              objValue = null;
            }
          }
        } // if (strValue != null)
      break;

      case "String":
      default:
      // No conversion
      objValue = strValue;
      break;
    }
  }

  // TODO Check maximum length objValue

  // Check custom validation function
  if (objFieldDescription.validation == null)
  {
    // No validation - value is always accepted
  }
  else
  {
    var objValue = objFieldDescription.validation(objValue, objFieldDescription, objSQLConnection);
    if (objValue == null)
    {
      // Invalid value according to custom function - cleanup then error
      if (blnMustDisconnect)
      {
        objSQLConnection.end();
      }
      throw new Error(req.i18n.__("Invalid value : field \"%s\" can't store value %s", objFieldDescription.name, (strValue == null ? "null" : "\""+strValue+"\"")));
    }
    // else store valid/normalized value
  }

  // Check if field is required (value must not be NULL or empty string!)
  if (objFieldDescription.required)
  {
    if (objValue == null || objValue == "")
    {
      throw new Error(req.i18n.__("Invalid value : REQUIRED field \"%s\" can't store value %s", objFieldDescription.name, (strValue == null ? "null" : "\""+strValue+"\"")));
    }
  }

  // Check if field is defined to store NULL in case its value is empty
  if (objFieldDescription.null_if_empty && objValue == "")
  {
    console.log("Storing NULL value (null_if_empty)");
    objValue = null;
  }

  // Use the SQL connection to escape value with appropriate charset/encoding
  if (blnEscapeString)
  {
    strSQLValue = objSQLConnection.escape(objValue);
  }
  else
  {
    strSQLValue = new String(objValue);
  }
  if (blnMustDisconnect)
  {
    objSQLConnection.end();
  }
  // DEBUG
  console.log("Conversion: strSQLValue=%s",strSQLValue);
  return(strSQLValue);
}

var form_ignore_fields = [
  "_OK",
  "_CANCEL"
];

var insert_record = function(req, res, next, objFormParameters, fnCallback)
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
  for (var intField = 0; intField < objFormParameters.fields.length; intField++)
  {
    var objField = objFormParameters.fields[intField];
    var strFieldName = objField.name;
    if (strFieldName)
    {
      // Don't look for excluded fields, like "_OK" or "_CANCEL"
      // Don't look for autoincrement columns (value will be generated by database after insert)
      if (form_ignore_fields.indexOf(strFieldName) == -1 && objFormParameters.autoincrement_column != strFieldName)
      {
        var strFieldValue = req.body[strFieldName];
        var strSQLValue = check_field_value(strFieldValue,objField,objSQLConnection, req);
        arrSQLNames.push(objSQLConnection.escapeId(strFieldName)); // TODO handle name translation from HTML FORM to SQL TABLE COLUMN
        arrSQLValues.push(strSQLValue);
      } // if (form_ignore_fields.indexOf(strFieldName) == -1 && objFormParameters.autoincrement_column != strFieldName)
    } // if (strFieldName)
  } // for (var intField = 0; intField < objFormParameters.fields.length; intField++)

  var strSQL = "INSERT INTO "+objSQLConnection.escapeId(objFormParameters.table_name)+"("+arrSQLNames.join(",")+")\n"
             + "VALUES("+arrSQLValues.join(",")+")\n;"
             ;
  // DEBUG
  console.log(strSQL);

  // Execute INSERT query, reusing the same connection
  runsql(strSQL, function(err, arrRows, fields) {
    if (fnCallback)
    {
      // Custom function defined: call it with the same connection (to successfully use LAST_INSERT_ID() function)
      // ATTENTION: this function MUST close the SQL connection after usage!
      fnCallback(err, arrRows, fields, objSQLConnection);
    }
    else
    {
      // No custom function: cleanup then redirect to list
      if (objSQLConnection)
      {
        objSQLConnection.end();
      }
      res.redirect('list');
    }
  }, objSQLConnection);
}

var update_record = function(req, res, next, objFormParameters, fnCallback)
{
  // Must be something in the body
  if (!req.body) return res.sendStatus(400);

  var objSQLConnection = new_connection();

  var arrSQLNamesEqualValues = new Array();
  var arrSQLWhere = new Array();
  for (var strSentName in req.body)
  {
    if (form_ignore_fields.indexOf(strSentName) == -1)
    {
      var strSQLValue = null;
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

        // Unknown field: cleanup then error!
        if (objSQLConnection)
        {
          objSQLConnection.end();
        }
        throw new Error(req.i18n.__("ERROR: field \"%s\" is unknown!",strSentName));

      } // if (objField == null)
      else
      {
        strSQLValue = check_field_value(req.body[strSentName],objField,objSQLConnection, req);
      } // else if (objField == null)

      if (objFormParameters.autoincrement_column == strSentName)
      {

        // Build where clause with primary key names and values
        arrSQLWhere.push(objSQLConnection.escapeId(objField.name)+"="+strSQLValue); // TODO handle name translation from HTML FORM to SQL TABLE COLUMN

      } // if (objFormParameters.autoincrement_column == strSentName)
      else
      {
        if (objField == null)
        {

          // Unknown field: cleanup then error!
          if (objSQLConnection)
          {
            objSQLConnection.end();
          }
          throw new Error(req.i18n.__("ERROR: field \"%s\" is unknown!",strSentName));

        } // if (objField == null)
        else
        {
          arrSQLNamesEqualValues.push(objSQLConnection.escapeId(objField.name)+"="+strSQLValue); // TODO handle name translation from HTML FORM to SQL TABLE COLUMN
        } // else if (objField == null)

      } // else if (objFormParameters.autoincrement_column == strSentName)

    } // if (form_ignore_fields.indexOf(strSentName) == -1)

  } // for (var objField in req.body)

  var strSQL = "UPDATE "+objSQLConnection.escapeId(objFormParameters.table_name)+"\n SET "+arrSQLNamesEqualValues.join(",")+" \n"
             + "WHERE "+arrSQLWhere.join(" AND ")+"\n;"
             ;
  // DEBUG
  console.log(strSQL);

  // Execute query, reusing the same connection
  runsql(strSQL, function(err, arrRows, fields) {
    if (fnCallback)
    {
      // Custom function defined: call it with the same connection (to successfully use LAST_INSERT_ID() function)
      // ATTENTION: this function MUST close the SQL connection after usage!
      fnCallback(err, arrRows, fields, objSQLConnection);
    }
    else
    {
      // No custom function: Cleanup then redirect to list
      if (objSQLConnection)
      {
        objSQLConnection.end();
      }
      res.redirect('list');
    }
  }, objSQLConnection);
}

var delete_record = function(req, res, next, objFormParameters, fnCallback)
{
  // Must be something in the body
  if (!req.body) return res.sendStatus(400);

  var objSQLConnection = new_connection();

  var arrSQLWhere = new Array();
  for (var strSentName in req.body)
  {
    if (form_ignore_fields.indexOf(strSentName) == -1)
    {
      var strSQLValue = null;
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

        // Unknown field: cleanup then error!
        if (objSQLConnection)
        {
          objSQLConnection.end();
        }
        throw new Error(req.i18n.__("ERROR: field \"%s\" is unknown!",strSentName));

      } // if (objField == null)
      else
      {
        strSQLValue = check_field_value(req.body[strSentName],objField,objSQLConnection, req);
      } // else if (objField == null)

      if (objFormParameters.autoincrement_column == strSentName)
      {

        // Build where clause with primary key names and values
        arrSQLWhere.push(objSQLConnection.escapeId(objField.name)+"="+strSQLValue); // TODO handle name translation from HTML FORM to SQL TABLE COLUMN

      } // if (objFormParameters.autoincrement_column == strSentName)
      else
      {

        // Build where clause with any key names and values
        arrSQLWhere.push(objSQLConnection.escapeId(objField.name)+"="+strSQLValue); // TODO handle name translation from HTML FORM to SQL TABLE COLUMN

      } // else if (objFormParameters.autoincrement_column == strSentName)

    } // if (form_ignore_fields.indexOf(strSentName) == -1)

  } // for (var objField in req.body)

  var strSQL = "DELETE FROM "+objSQLConnection.escapeId(objFormParameters.table_name)+"\n"
             + "WHERE "+arrSQLWhere.join(" AND ")+"\n;"
             ;
  // DEBUG
  console.log(strSQL);

  // Execute query, reusing the same connection
  runsql(strSQL, function(err, arrRows, fields) {
    if (fnCallback)
    {
      // Custom function defined: call it with the same connection (to successfully use LAST_INSERT_ID() function)
      // ATTENTION: this function MUST close the SQL connection after usage!
      fnCallback(err, arrRows, fields, objSQLConnection);
    }
    else
    {
      // No custom function: Cleanup then redirect to list
      if (objSQLConnection)
      {
        objSQLConnection.end();
      }
      res.redirect('list');
    }
  }, objSQLConnection);
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
        throw new Error(req.i18n.__("Can't find parameter \"%s\" in request",strPKName));
      }
    } // if (strPKName)
  } // for (var intPK = 0; intPK < objFormParameters.primary_key.length; intPK++)

  var strSQL = "SELECT * FROM "+objSQLConnection.escapeId(objFormParameters.table_name)
             + "\nWHERE "+arrSQLPKNamesEqualValues.join("\n AND ")+"\n;"
             ;
  // DEBUG
  console.log(strSQL);

  runsql(strSQL, function(err, arrRows, fields) {
    // MUST HAVE a custom function defined
    fnCallback(err, arrRows, fields);
  }, objSQLConnection);

  if (objSQLConnection)
  {
    objSQLConnection.end();
  }
}

var list_record = function(req, res, next, objFormParameters, objSQLOptions, fnCallback)
{
  var objSQLConnection = new_connection();

  // DEBUG console.log("primary_key=%j\n",objFormParameters.primary_key);

  // Get options
  var arrOrderByFields = new Array();
  if (objSQLOptions && objSQLOptions.order_by)
  {
    for (var intField = 0; intField < objSQLOptions.order_by.length; intField++)
    {
      arrOrderByFields.push(objSQLConnection.escapeId(objSQLOptions.order_by[intField].name) + (objSQLOptions.order_by[intField].direction ? " "+objSQLOptions.order_by[intField].direction : ""));
    }
  }
  var strSQL = "SELECT * FROM "+objSQLConnection.escapeId(objFormParameters.table_name)
             + (arrOrderByFields.length ? " \nORDER BY "+ arrOrderByFields.join(", ") : "")
             + (objSQLOptions && objSQLOptions.limit ? " \nLIMIT " + objSQLConnection.escape(objSQLOptions.limit) : "")
             +"\n;";
  // DEBUG
  console.log(strSQL);

  runsql(strSQL, function(err, arrRows, fields) {
    fnCallback(err, arrRows, fields);
  });

  if (objSQLConnection)
  {
    objSQLConnection.end();
  }
}

var handle_error = function(err, res, req, template_name, options)
{
  // handle duplicate key errors (e.g. login must be unique but it is provided by user, just like ISBN)
  if (err && err.message.indexOf("ER_DUP_ENTRY") != -1)
  {
    // e.g. ISBN13 duplicate: Error: ER_DUP_ENTRY: Duplicate entry '9782841772292' for key 'id_isbn13'
    res.render(template_name, { req:req, title: options.title, subtitle: options.subtitle, menus:options.menus, form:options.form, message:{text:options.message.text,type:"danger"}, action:options.action });
  }
  else
  {
    throw err;
  }
}

var search_record = function(req, res, next, objFormParameters, objSQLOptions, fnCallback)
{
  // Must be something in the body
  if (!req.body) return res.sendStatus(400);

  var objSQLConnection = new_connection();

  var arrSQLNamesEqualValues = new Array();
  var arrSQLWhere = new Array();
  for (var strSentName in req.body)
  {
    if (form_ignore_fields.indexOf(strSentName) == -1)
    {
      var strSQLValue = null;
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
        throw new Error(req.i18n.__("ERROR: field \"%s\" is unknown!",strSentName));

      } // if (objField == null)
      else
      {
        strSQLValue = check_field_value(req.body[strSentName],objField,objSQLConnection, req);
      } // else if (objField == null)

      // Build where clause with primary key names and values
      arrSQLWhere.push("MATCH ("+objField.match_fields.join(", ")+") AGAINST ("+strSQLValue+" IN BOOLEAN MODE)");

    } // if (form_ignore_fields.indexOf(strSentName) == -1)

  } // for (var objField in req.body)

  var strSQL = "SELECT "+(objFormParameters.list_fields ? objFormParameters.list_fields : "*" )+" FROM "+objSQLConnection.escapeId(objFormParameters.table_name)
             + "\nWHERE "+arrSQLWhere.join("\n AND ")+"\n;"
             ;
  // DEBUG
  console.log(strSQL);

  runsql(strSQL, function(err, arrRows, fields) {
    fnCallback(err, arrRows, fields);
  });

  if (objSQLConnection)
  {
    objSQLConnection.end();
  }
}

var format_isbn = function(strRawValue)
{
  var strValue = strRawValue;

  if (strValue != null)
  {
    // Remove spaces at beginning/end
    strValue = strValue.replace(/^ +/g, "").replace(/ +$/g, "");
    // Remove dashes and spaces - if string is longuer than 13
    if (strValue.length > 13)
    {
      strValue = strValue.replace(/[ -]+/g, "");
    }
    // Hack: some barcode readers mistype numbers/letters on (french) keyboard : fix it
    strValue = strValue.replace(/&/g, "1")
                       .replace(/é/g, "2")
                       .replace(/"/g, "3")
                       .replace(/'/g, "4")
                       .replace(/\(/g, "5")
                       .replace(/-/g, "6")
                       .replace(/è/g, "7")
                       .replace(/_/g, "8")
                       .replace(/ç/g, "9")
                       .replace(/à/g, "0");
  }
  return(strValue);
}

// Return only rows with a value ("fieldCount" != ​0)
function sql_get_rows(arrRows, objOptions)
{
  var rows = null;

  var blnReturnLast = true;
  if (objOptions && objOptions.only_last == false)
  {
    blnReturnLast = false;
  }

  if (arrRows != null)
  {
    for (var intRecords = 0; intRecords < arrRows.length; intRecords++)
    {
      if (arrRows[intRecords].fieldCount == 0)
      {
        // Don't include
      }
      else
      {
        if (blnReturnLast)
        {
          // Return only the last non-empty record
          rows = arrRows[intRecords];
        }
        else
        {
          // Return array of all records
          if (rows == null)
          {
            rows = new Array();
          }
          rows.push(arrRows[intRecords]);
        } // if (blnReturnLast)
      }
    } // for (var intRecords = 0; intRecords < arrRows.length; intRecords++)

  } // if (arrRows != null)
  return(rows);
}

module.exports.new_connection = new_connection;
module.exports.runsql = runsql;
module.exports.check_field_value = check_field_value;
module.exports.form_ignore_fields = form_ignore_fields;
module.exports.insert_record = insert_record;
module.exports.update_record = update_record;
module.exports.delete_record = delete_record;
module.exports.view_record = view_record;
module.exports.list_record = list_record;
module.exports.search_record = search_record;
module.exports.handle_error = handle_error;
module.exports.format_isbn = format_isbn;
module.exports.rows = sql_get_rows;
