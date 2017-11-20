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

var mysql = require('mysql')
var db = require('../routes/db') // database utilities
var config = require('../setup/config.js')
var debug = require('debug')('bibliopuce:setup_img')
var request = require('request')
var jsdom = require("jsdom")
var async = require("async")
var fs = require('fs')
var path = require('path')

function getTimeStamp (objDate) {
  if (objDate == null)
  {
    objDate = new Date()
  }
  var intHours = objDate.getHours()
  var strHours = (intHours < 10 ? "0" + intHours.toString(10) : intHours.toString(10))
  var intMinutes = objDate.getMinutes()
  var strMinutes = (intMinutes < 10 ? "0" + intMinutes.toString(10) : intMinutes.toString(10))
  var intSeconds = objDate.getSeconds()
  var strSeconds = (intSeconds < 10 ? "0" + intSeconds.toString(10) : intSeconds.toString(10))

  // Will display time in 10:30:23 format
  var strTimeStamp = strHours + strMinutes + strSeconds
  return (strTimeStamp)
}

var strTimeStamp = getTimeStamp(new Date())
var strSQLBackupUserTable = "`"+strTimeStamp+"_user`"
var strMySQLHost = config.database.host_name
var strMySQLDatabase = config.database.database_name
var strMySQLUser = "root"
var strMySQLPassword = process.env.MYSQL_ROOT_PASSWORD;
var objSQLConnection= mysql.createConnection({
    host     : strMySQLHost,
    user     : strMySQLUser,
    database : strMySQLDatabase,
    password : strMySQLPassword,
    multipleStatements: true,
    charset  : 'UTF8_GENERAL_CI'
  })
objSQLConnection.connect()
var strClassCSVFile = process.env.HOME + '/load_class.csv'
var strCharset = "latin1"
if (fs.existsSync(strClassCSVFile)) {

  // TODO Parameters:
  //  * csv file name,
  //  * character set (automatically detect?),
  //  * mapping csv field number to user.fields (last_name,first_name, category = field0,field1,field4)

  db.runsql("\
  DROP TABLE IF EXISTS temp_load_class \n\
  ; \n\
  CREATE TABLE temp_load_class( \n\
    id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY, \n\
    field0 VARCHAR(255) NULL, \n\
    field1 VARCHAR(255) NULL, \n\
    field2 VARCHAR(255) NULL, \n\
    field3 VARCHAR(255) NULL, \n\
    field4 VARCHAR(255) NULL, \n\
    field5 VARCHAR(255) NULL, \n\
    field6 VARCHAR(255) NULL, \n\
    field7 VARCHAR(255) NULL, \n\
    field8 VARCHAR(255) NULL, \n\
    field9 VARCHAR(255) NULL, \n\
    field_other TEXT NULL \n\
  ) \n\
  ; \n\
  LOAD DATA LOCAL INFILE '"+strClassCSVFile+"' \n\
  INTO TABLE temp_load_class \n\
  CHARACTER SET '"+strCharset+"' \n\
  FIELDS TERMINATED BY ',' \n\
  LINES STARTING BY '' TERMINATED BY '\n' \n\
  IGNORE 1 LINES \n\
  (field0, field1, field2, field3, field4, field5, field6, field7, field8, field9, field_other) \n\
  ; \n\
  /* Backup existing users */ \n\
  CREATE TABLE "+strSQLBackupUserTable+" LIKE user \n\
  ; \n\
  INSERT INTO "+strSQLBackupUserTable+" SELECT * FROM user \n\
  ; \n\
  /* Remove users from previous years (CAUTION: can't delete users with active borrowings) */ \n\
  DELETE FROM user \n\
  USING user \n\
  LEFT OUTER JOIN borrow ON user.id = borrow.user_id \n\
  WHERE borrow.id IS NULL \n\
  ; \n\
  INSERT INTO user(last_name, first_name, category) SELECT field0,field1,field4 FROM temp_load_class \n\
  ; \n\
  " /* strSQL */,
      function (err, arrRows, fields) {
        if (err) {
          if (objSQLConnection) {
            objSQLConnection.end()
          }
          throw err
        }

        // Rename file load_class.csv to avoid DOUBLE CALL!
        fs.renameSync(strClassCSVFile, strClassCSVFile + '.ok')

        process.exit(0)
      }, objSQLConnection
  )
} else {
  var strError = 'ERROR: Can\'t find file "' + strClassCSVFile + '"'
  console.error(strError)
  db.runsql('INSERT INTO log(`date_time`, `type`, `label`, `request`, `result`) \n' +
  'VALUES (\n' +
  '  NOW(), \'SETUP\', \'load_class.js\', ' + objSQLConnection.escape(strClassCSVFile) + ', ' + objSQLConnection.escape(strError) + ' \n' +
  ')\n' +
  ';\n', function (err, arrRows, fields) {
    if (err) {
      if (objSQLConnection) {
        objSQLConnection.end()
      }
      throw err
    }
    process.exit(1)
  }, objSQLConnection, false /* blnLogIt */)
} // if (fs.existsSync(strClassCSVFile)) {
