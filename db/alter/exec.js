/* Execute ALTER requests - if never executed before */
var fs = require("fs");
var child_process = require("child_process");
var db = require('../../routes/db'); // database utilities
var async = require("async");
var objSQLConnection = db.new_connection();

var arrSQLFiles = new Array();
var arrFiles = fs.readdirSync("." /* path */);
console.log("arrFiles=%j", arrFiles);
for (var intFile = 0; intFile < arrFiles.length; intFile++)
{
  if (arrFiles[intFile].match(/\.sql$/))
  {
    arrSQLFiles.push(arrFiles[intFile]);
  }
}
console.log("arrSQLFiles=%j", arrSQLFiles);

async.map(arrSQLFiles, function(strFile, callback) {
  console.log("strFile=%s", strFile);
  var strInfo = null;
  var strGitCommand = "git log -n 1 --format=\""+strFile+"/%H/%ct\" -- "+strFile;
  console.log("strGitCommand=%s", strGitCommand);
  strInfo = require("child_process").execSync(strGitCommand);
  console.log("strInfo=%s", strInfo);
  callback(null, strInfo);
}, function(err, arrInfo) {
  // arrInfo is an array of git commit info for each SQL file
  if (err)
  {
    throw err;
  }
  else
  {
    console.log("arrInfo=%j", arrInfo);
    var arrSQL = new Array();
    arrSQL.push("DROP TEMPORARY TABLE IF EXISTS tmp_alter\n;\n");
    arrSQL.push("\
CREATE TEMPORARY TABLE tmp_alter(\n\
commit_id VARCHAR(64) NOT NULL COMMENT 'Unique commit identifier for alter script',\n\
alter_file VARCHAR(255) NOT NULL COMMENT 'Name of alter script file (.sql)',\n\
commit_timestamp BIGINT NOT NULL COMMENT 'Timestamp of commit',\n\
\n\
UNIQUE KEY(commit_id,alter_file),\n\
KEY(commit_timestamp)\n\
)\n;\n");
    for (var intInfo = 0; intInfo < arrInfo.length; intInfo++)
    {
      var strInfo = arrInfo[intInfo];
      console.log("strInfo=%s", strInfo);
      var arrFileInfo = new String(strInfo).split("/");
      var strFile = arrFileInfo[0];
      var strCommitId = arrFileInfo[1];
      var strCommitTimestamp = arrFileInfo[2];
      var intCommitTimestamp = parseInt(strCommitTimestamp, 10);
      if (strCommitId == "" || strCommitId == null)
      {
        console.log("No commit - no execute.");
      }
      else
      {
        arrSQL.push("\
INSERT INTO tmp_alter(commit_id,alter_file,commit_timestamp) \n\
VALUES("+objSQLConnection.escape(strCommitId)+","+objSQLConnection.escape(strFile)+","+objSQLConnection.escape(intCommitTimestamp)+")\n;\n");
      }
    } // for

    // Use MySQL to find non-executed alters and sort them by commit date
    arrSQL.push("\
SELECT tmp_alter.* FROM tmp_alter \n\
LEFT OUTER JOIN my_alter ON my_alter.commit_id = tmp_alter.commit_id AND my_alter.alter_file = tmp_alter.alter_file \n\
WHERE my_alter.commit_id IS NULL \n\
ORDER BY tmp_alter.commit_timestamp \n\
;\n");

    // Execute SQL Request to find alters to do
    db.runsql(arrSQL, function (err, arrRows, fields) {
      if (err)
      {
        throw err;
      }
      var rows = db.rows(arrRows);
      // DEBUG
      console.log("rows=%j",rows);

      if (rows.length)
      {
        // Execute array of requests - and store it in table my_alter after execution
        // WARNING: requests must be run IN SEQUENCE (or it may fail), thus using async.queue with concurrency=1
        var q = async.priorityQueue(function (task, fnCallback) {
            console.log("Executing \"%s\"...", task.alter_file);
            var objNewSQLConnection = db.new_connection();
            var strSQL = fs.readFileSync(task.alter_file);
            // Add "INSERT INTO my_alter" to prevent further execution of script
            strSQL += "\n\
  INSERT INTO my_alter(commit_id,alter_file,commit_timestamp) \n\
  VALUES("+objNewSQLConnection.escape(task.commit_id)+","+objNewSQLConnection.escape(task.alter_file)+","+objNewSQLConnection.escape(task.commit_timestamp)+")\n;\n";
            objNewSQLConnection.end();
            db.runsql(strSQL, function (objError) {
              // DEBUG
              console.log("Request Done");
              if (objError)
              {
                throw objError;
              }
              // DEBUG
              console.log("Request OK");
              console.log("Still running = %d",q.running());
              if (q.running() == 0)
              {
                process.exit(0);
              }
            });

            fnCallback();
        }, 1); // maximum 1 parrallel (thus => sequence)

        // Add all sql request to execute to the queue
        for (var intRow = 0; intRow < rows.length; intRow++)
        {
          console.log("task %d: %j", intRow, rows[intRow]);
          q.push(rows[intRow], intRow);
        }

        // assign a callback
        q.drain = function() {
            console.log('all items have been processed');
        }

      } // if (rows.length)
      else
      {
        process.exit(0);
      } // else if (rows.length)

    }, objSQLConnection);

  }
});
