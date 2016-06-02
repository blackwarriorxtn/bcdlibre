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

var db = require('../routes/db'); // database utilities
var debug = require('debug')('bibliopuce:setup_img');
var request = require('request');
objSQLConnection = db.new_connection();

db.runsql("\
DROP TEMPORARY TABLE IF EXISTS temp_img \n\
; \n\
CREATE TEMPORARY TABLE temp_img( \n\
  isbn13 VARCHAR(13) NOT NULL PRIMARY KEY, \n\
  result_json TEXT NOT NULL \n\
) \n\
; \n\
INSERT IGNORE INTO temp_img(isbn13, result_json) \n\
SELECT SUBSTRING(request, LOCATE('isbn=',request)+5) AS isbn13, CONVERT( UNCOMPRESS( result ) USING 'utf8' ) AS result_json \n\
FROM log \n\
WHERE request LIKE 'http://localhost:3000/item/aws%' \n\
ORDER BY id DESC \n\
; \n\
SELECT temp_img.*, item_detail.id AS item_detail_id, item_detail.title \n\
FROM temp_img \n\
JOIN item_detail ON item_detail.isbn13 = temp_img.isbn13 \n\
LIMIT 1 /* TODO DELETE !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!*/ \n\
; \n\
DROP TEMPORARY TABLE IF EXISTS temp_img \n\
; \n\
" /* strSQL */,
    function(err, arrRows, fields) {
      if (err)
      {
        if (objSQLConnection)
        {
          objSQLConnection.end();
        }
        throw err;
      }
      var rows = db.rows(arrRows);

      for (var intRow = 0; intRow < rows.length; intRow++)
      {
        var strISBN13 = rows[intRow].isbn13;
        var intItemDetailId = rows[intRow].item_detail_id;
        if (strISBN13)
        {
          debug("isbn13 = %s", strISBN13);
          var objResult = JSON.parse(rows[intRow].result_json);
          if (objResult)
          {
            // debug("objResult = %j", objResult);
            if (objResult.ItemLookupResponse && objResult.ItemLookupResponse.Items && objResult.ItemLookupResponse.Items.Item && objResult.ItemLookupResponse.Items.Item.DetailPageURL)
            {
              var strDetailsURL = objResult.ItemLookupResponse.Items.Item.DetailPageURL;
              debug("strDetailsURL=%s",strDetailsURL);
              console.log("Downloading Book URL "+strDetailsURL);
              const options = {
                url :  strDetailsURL,
                json : true
              };
              request(options,
                function(err, res, body) {
                  if (err)
                  {
                    console.log("ERROR: %s", err);
                  }
                  else
                  {
                    // Run some jQuery on a html fragment
                    var jsdom = require("jsdom");

                    jsdom.env(
                      body,
                      ["http://code.jquery.com/jquery.js"],
                      function (err, window) {
                        if (err)
                        {
                          console.log("ERROR: %s", err);
                        }
                        else
                        {
                          var strImageLink = window.$("img[id='imgBlkFront']").attr("src");
                          console.log("src of img.id=imgBlkFront = %s", strImageLink);
                          if (strImageLink && strImageLink.match(/^https?\:/))
                          {
                            db.runsql("UPDATE item_detail SET img_url = "+objSQLConnection.escape(strImageLink)+" WHERE id = "+intItemDetailId.toString(10)+";",
                                      function(err, arrRows, fields) {
                                        if (err)
                                        {
                                          console.log("ERROR: %s", err);
                                        }
                                      });
                          } // if (strImageLink && strImageLink.match(/^https?\:/))
                        }
                      }
                    );
                  } // else if (err)
                }
              );
            }
          } // if (objResult)
        } // if (strISBN13)
      } // for (var intRow = 0; intRow < rows.length; intRow++)

    }, objSQLConnection);

if (objSQLConnection)
{
  objSQLConnection.end();
}
