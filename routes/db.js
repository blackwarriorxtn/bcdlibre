/*
      Copyright 2016 Replay SDK (http://www.replay-sdk.com)

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

var mysql = require('mysql');
var config = require('../setup/config.js');
var debug = require('debug')('bibliopuce:routes_db');
var path = require('path');

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
      multipleStatements: true,
      charset  : 'UTF8_GENERAL_CI'
    });
  objSQLConnection.connect();
  return(objSQLConnection);
}

var runsql = function (objSQL, fnCallback, objSQLConnection)
{
  var blnMustDisconnect = false;
  if (objSQLConnection == null)
  {
    debug("Opening new connection...");
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
  debug("SQL:\n%s\n", strSQL);
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


  debug("check_field_value(strValue=\"%s\", objFieldDescription: %j ...)", strValue, objFieldDescription);

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
                debug("Conversion: value=%d",intValue);
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
    debug("Storing NULL value (null_if_empty)");
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
  debug("Conversion: strSQLValue=%s",strSQLValue);
  return(strSQLValue);
}

var form_ignore_fields = [
  "_OK",
  "_CANCEL"
];

var insert_record = function(req, res, next, objFormParameters, fnCallback)
{
  debug("insert_record");

  // Must be something in the body
  if (!req.body) return res.sendStatus(400);

  var objSQLConnection = new_connection();

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
      // Don't look for read-only fields (you can't set/insert them)
      if (form_ignore_fields.indexOf(strFieldName) == -1
          && objFormParameters.autoincrement_column != strFieldName
          && objField.read_only != true)
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
  debug(strSQL);

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
  debug("update_record");

  // Must be something in the body
  if (!req.body) return res.sendStatus(400);

  debug("req.body = %j", req.body);

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
          debug("strFieldName=\""+strFieldName+"\"\n");
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
          // Don't update read_only fields
          if (objField.read_only != true)
          {
            arrSQLNamesEqualValues.push(objSQLConnection.escapeId(objField.name)+"="+strSQLValue); // TODO handle name translation from HTML FORM to SQL TABLE COLUMN
          }
        } // else if (objField == null)

      } // else if (objFormParameters.autoincrement_column == strSentName)

    } // if (form_ignore_fields.indexOf(strSentName) == -1)

  } // for (var objField in req.body)

  var strSQL = "UPDATE "+objSQLConnection.escapeId(objFormParameters.table_name)+"\n SET "+arrSQLNamesEqualValues.join(",")+" \n"
             + "WHERE "+arrSQLWhere.join(" AND ")+"\n;"
             ;
  debug(strSQL);

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
  debug("delete_record");

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
          debug("strFieldName=\""+strFieldName+"\"\n");
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
  debug(strSQL);

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
  debug("view_record");

  // Must be something in the query (GET)
  if (!req.query) return res.sendStatus(400);

  var objSQLConnection = new_connection();

  debug("primary_key=%j\n",objFormParameters.primary_key);
  debug("req.body=%j\n",req.body);
  debug("req.query=%j\n",req.query);

  // Get primary key of form
  var arrSQLPKNamesEqualValues = new Array();
  var strSQLPKValue = null;
  for (var intPK = 0; intPK < objFormParameters.primary_key.length; intPK++)
  {
    var strPKName = objFormParameters.primary_key[intPK];
    debug("strPKName=%s\n",strPKName);
    if (strPKName)
    {
      // Check that this field has been sent in request
      if (req.query[strPKName])
      {
        var objField = objFormParameters.fields[0]; // TODO Find field with name = strPKName
        strSQLPKValue = check_field_value(req.query[strPKName],objField,objSQLConnection, req);
        var strSQLNameEqualValue = objSQLConnection.escapeId(strPKName) + " = " + strSQLPKValue;
        arrSQLPKNamesEqualValues.push(strSQLNameEqualValue);
      }
      else
      {
        throw new Error(req.i18n.__("Can't find parameter \"%s\" in request",strPKName));
      }
    } // if (strPKName)
  } // for (var intPK = 0; intPK < objFormParameters.primary_key.length; intPK++)

  var strSQLWhere = arrSQLPKNamesEqualValues.join("\n AND ");


  var strSQLTableName = (objFormParameters.view_table_name ? objFormParameters.view_table_name : objFormParameters.table_name);
  var strSQL = "SELECT * FROM "+objSQLConnection.escapeId(strSQLTableName)
             + "\nWHERE "+strSQLWhere+"\n;"
             ;
  if (objFormParameters.sql_counter)
  {
    strSQL += objFormParameters.sql_counter.replace(/\?/, strSQLPKValue);
  }
  debug(strSQL);

  runsql(strSQL, function(err, arrRows, fields) {
    debug("arrRows = %j",arrRows);
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
  debug("list_record");

  var objSQLConnection = new_connection();

  debug("primary_key=%j\n",objFormParameters.primary_key);

  // Get options
  var arrOrderByFields = new Array();
  if (objSQLOptions && objSQLOptions.order_by)
  {
    for (var intField = 0; intField < objSQLOptions.order_by.length; intField++)
    {
      arrOrderByFields.push(objSQLConnection.escapeId(objSQLOptions.order_by[intField].name) + (objSQLOptions.order_by[intField].direction ? " "+objSQLOptions.order_by[intField].direction : ""));
    }
  }
  var strSQLTableName = (objFormParameters.list_table_name ? objFormParameters.list_table_name : objFormParameters.table_name);
  var strSQL = "SELECT * FROM "+objSQLConnection.escapeId(strSQLTableName)
             + (arrOrderByFields.length ? " \nORDER BY "+ arrOrderByFields.join(", ") : "")
             + (objSQLOptions && objSQLOptions.limit ? " \nLIMIT " + objSQLConnection.escape(objSQLOptions.limit) : "")
             +"\n;";
  debug(strSQL);

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
  debug("search_record");

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
          debug("strFieldName=\""+strFieldName+"\"\n");
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
             + (arrSQLWhere.length == 0 ? "" : "\nWHERE "+arrSQLWhere.join("\n AND ") )+"\n;"
             ;
  debug(strSQL);

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

    // Try to determine if string contains an ISBN or not
    if (
      /* Only numbers AND dashes */
      strValue.match(/^[0-9-]+$/) ||
      /* Only french keyboard letters for numbers (including dashes) */
      strValue.match(/^[&é"'\(è_çà-]+$/)
    )
    {
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
                         /* TOO dangerous .replace(/-/g, "6") */
                         .replace(/è/g, "7")
                         .replace(/_/g, "8")
                         .replace(/ç/g, "9")
                         .replace(/à/g, "0");
    }
    // else: not an ISBN number, do nothing
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

function img_folder(intItemDetailId)
{
  var strImageFile = ("0000000000" + intItemDetailId).slice(-10);
  var strImageFolder = path.join(__dirname,"..","public","img","item",strImageFile.substring(0,2),strImageFile.substring(2,4),strImageFile.substring(4,6),strImageFile.substring(6,8),strImageFile.substring(8,10));
  return(strImageFolder);
}

function img_file(intItemDetailId, strFileExt)
{
  var strImageFile = ("0000000000" + intItemDetailId).slice(-10);
  var strImageFolder = img_folder(intItemDetailId);
  var strImageFilePath = path.join(strImageFolder,strImageFile + strFileExt);
  return(strImageFilePath);
}
function img_virtual_path(intItemDetailId, strFileExt)
{
  var strImageFile = ("0000000000" + intItemDetailId).slice(-10);
  var strImageVirtualFolder = ["", "static","img","item",strImageFile.substring(0,2),strImageFile.substring(2,4),strImageFile.substring(4,6),strImageFile.substring(6,8),strImageFile.substring(8,10)].join("/");
  var strImageFilePath = strImageVirtualFolder + "/" + strImageFile + strFileExt;
  return(strImageFilePath);
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
module.exports.img_file = img_file;
module.exports.img_folder = img_folder;
module.exports.img_virtual_path = img_virtual_path;
