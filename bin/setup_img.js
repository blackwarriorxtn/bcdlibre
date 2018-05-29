/*
      Copyright 2016-2018 Replay SDK (http://www.replay-sdk.com)

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
var jsdom = require("jsdom");
var async = require("async");
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
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
WHERE item_detail.img_url IS NULL \n\
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

      async.eachLimit(rows, 1, function (row, callback) {

        var strISBN13 = row.isbn13;
        var intItemDetailId = row.item_detail_id;
        var strTitle = row.title;
        if (strISBN13)
        {
          debug("isbn13 = %s", strISBN13);
          var objResult = JSON.parse(row.result_json);
          if (objResult)
          {
            // debug("objResult = %j", objResult);
            if (objResult.ItemLookupResponse && objResult.ItemLookupResponse.Items && objResult.ItemLookupResponse.Items.Item && objResult.ItemLookupResponse.Items.Item.DetailPageURL)
            {
              var strDetailsURL = objResult.ItemLookupResponse.Items.Item.DetailPageURL;
              // debug("strDetailsURL=%s",strDetailsURL);
              // console.log("Downloading Book URL "+strDetailsURL);
              request({url :  strDetailsURL},
                function(err, res, body) {
                  if (err)
                  {
                    console.log("ERROR: Can't download URL %s for %s %s : %s", strDetailsURL, strISBN13, strTitle, err);
                  }
                  else
                  {
                    console.log("Book Page downloaded for %s %s ", strISBN13, strTitle);
                    // Fetch img URL from HTML
                    jsdom.env(
                      body,
                      ["http://code.jquery.com/jquery.js"],
                      function (err, window) {
                        if (err)
                        {
                          console.log("ERROR: Can't parse HTML for %s %s : %s", strISBN13, strTitle, err);
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
                                  console.log("ERROR: Can't update item_detail for %s %s : %s", strISBN13, strTitle, err);
                                }
                                // Download and save image in cache (public/img/item/00/00/00/00/0000000001.jpg)
                                var strImageFolder = db.img_folder(intItemDetailId);
                                var strImageFilePath = db.img_file(intItemDetailId, path.extname(strImageLink));
                                console.log("Cache image file : \"%s\"", strImageFilePath);
                                mkdirp.sync(strImageFolder);
                                request.head(strImageLink, function(err, res, body){
                                  if (err)
                                  {
                                    console.log("ERROR: Can't download image %s for %s %s : %s", strImageLink, strISBN13, strTitle, err);
                                  }
                                  else
                                  {
                                    console.log("Book Image downloaded for %s %s ", strISBN13, strTitle);
                                    console.log('content-type:', res.headers['content-type']);
                                    console.log('content-length:', res.headers['content-length']);
                                    request(strImageLink).pipe(fs.createWriteStream(strImageFilePath));
                                  }
                                });
                              });
                          } // if (strImageLink && strImageLink.match(/^https?\:/))
                          else
                          {
                            console.log("ERROR: Can't find img.id=imgBlkFront in HTML for %s %s (%s)", strISBN13, strTitle, strDetailsURL);
                          } // if (strImageLink && strImageLink.match(/^https?\:/))

                        }
                      }
                    );
                  } // else if (err)
                }
              );
            } // if (objResult.ItemLookupResponse && objResult.ItemLookupResponse.Items && objResult.ItemLookupResponse.Items.Item && objResult.ItemLookupResponse.Items.Item.DetailPageURL)
            else
            {
              console.log("ERROR: Invalid Web Service result for %s %s (no DetailPageURL)", strISBN13, strTitle);
            } // // if (objResult.ItemLookupResponse && objResult.ItemLookupResponse.Items && objResult.ItemLookupResponse.Items.Item && objResult.ItemLookupResponse.Items.Item.DetailPageURL)
          } // if (objResult)
        } // if (strISBN13)

        // Pause 1.5s to avoid being blocked by source
        setTimeout(function() {
          callback();
        }, 1500);

      }, function done() {
//        process.exit(0);
      });

    }, objSQLConnection);
