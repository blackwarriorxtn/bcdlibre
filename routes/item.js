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

var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var db = require('./db'); // database utilities
var request = require('request');
var async = require('async');
var config = require('../setup/config.js');
var debug = require('debug')('bibliopuce:routes_item');
var fs = require('fs');
var path = require('path');
var xml2js = require('xml2js');
var mkdirp = require('mkdirp');

var strAWSId = config.webservices.aws.awsId;
var strAWSSecret = config.webservices.aws.awsSecret;
var strAWSAssocId = config.webservices.aws.assocId;
var strAWSLocale = config.webservices.aws.locale;
var AWSOperationHelper = require('apac').OperationHelper;
var objAWSOpHelper = new AWSOperationHelper({
  awsId:     strAWSId,
  awsSecret: strAWSSecret,
  assocId:   strAWSAssocId,
  locale:    strAWSLocale,
  /* Enable automatic throttling option to workaround Amazon's limit of one request per second per IP */
  maxRequestsPerSecond: 1
});

// ******************************************************************************** item
function module_context(req, res, next)
{
  // *** PARAMETERS (SQL)
  this.objFormParameters = {
    table_name: "item_detail",
    /* Use a VIEW to list items with number of copies */
    list_table_name: "item_list",
    primary_key: ["id"],
    autoincrement_column: "id",
    fields:[
      {name:"id",label:"#",type:"Integer",required:false,validation:null},
      /* NOTE: we use a maximum length of 16 to let user copy/paste full ISBN with dashes or spaces, then normalize it to 13 characters */
      {name:"isbn13",label:req.i18n.__("Numéro ISBN"),type:"String",required:false,validation:null,maximum_length:16,null_if_empty:true},
      {name:"classification",label:req.i18n.__("Classification"),type:"String",required:false,validation:null,maximum_length:255,autoreplay:true},
      {name:"title",label:req.i18n.__("Titre"),type:"String",required:true,validation:null,maximum_length:255},
      {name:"author",label:req.i18n.__("Auteur"),type:"String",required:true,validation:null,maximum_length:255},
      {name:"series_title",label:req.i18n.__("Série"),type:"String",required:false,validation:null,maximum_length:255,autoreplay:true},
      {name:"description",label:req.i18n.__("Description (Synopsis)"),type:"String",required:false,validation:null,maximum_length:65535},
      {name:"img_url",label:null,type:"String",required:false,hidden:true,validation:null,maximum_length:255},
    ],
    allowed_states:null,
    sql_counter:"\
SELECT COUNT(item.id) AS counter, COUNT(borrow.id) AS borrowed\n\
FROM item LEFT OUTER JOIN borrow ON borrow.item_id = item.id\n\
WHERE item_detail_id = ? \n\
GROUP BY item_detail_id"
  };
  // To search we only have ONE field named "search" and a special SQL table with full text indexes
  this.objSearchParameters = {
    table_name: this.objFormParameters.table_name+"_search",
    primary_key: this.objFormParameters.primary_key,
    autoincrement_column: this.objFormParameters.autoincrement_column,
    list_fields:"item_detail_search.item_detail_id AS id, COUNT(item.id) AS counter, COUNT(borrow.id) AS borrowed, IF (COUNT(item.id) <= COUNT(borrow.id), 'warning', NULL) AS `__cssclass`, IF (COUNT(item.id) <= COUNT(borrow.id), 'warning', NULL) AS `__cssclass_counter`, IF (COUNT(item.id) <= COUNT(borrow.id), 'warning', NULL) AS `__cssclass_borrowed`, item_detail_search.title, item_detail_search.author, item_detail_search.description, item_detail_search.isbn13, item_detail_search.series_title, item_detail_search.classification",
    fields:[
      {
        name:"search",label:req.i18n.__("Titre, Auteur, Description"),type:"String",required:true,validation:null,maximum_length:255,
        match_fields:[
          "item_detail_search.isbn13",
          "item_detail_search.title",
          "item_detail_search.author",
          "item_detail_search.description",
          "item_detail_search.classification"
        ]
      },
    ],
    // Add a join to check if item has been borrowed (no need to investigate a book you can't borrrow)
    join : "\nJOIN item_detail ON item_detail.id = item_detail_search.item_detail_id \nLEFT OUTER JOIN item ON item.item_detail_id = item_detail.id \nLEFT OUTER JOIN borrow ON borrow.item_id = item.id ",
    // Add a group by for counter (number of copies and borrowed items)
    group_by : "GROUP BY item_detail_search.id",
    // Add an order by clause
    order_by : "DESC"
  };
  // *** PARAMETERS (MENU)
  this.objMenu = [{text:req.i18n.__("Gérer"),link:"/manage/"},{text:req.i18n.__("Livres"),link:"/item/"}];
  this.objMainMenu = {text:req.i18n.__("Menu principal"),link:"/"};
}

function aws_post_processing(strISBN, objResultItem, objWebServiceResult)
{
  debug("Amazon Web Service result: %j", objResultItem);
  if (objResultItem.Author)
  {
    var strNewValue = objResultItem.Author;
    debug("Amazon Web Service Authors = %s",strNewValue);
    // WARNING: don't overwrite result from another Web Service, unless this result is longuer (ok, it's a silly way to finding the most appropriate answer)
    if (objWebServiceResult.authors == null || objWebServiceResult.authors.length < strNewValue.length)
    {
      objWebServiceResult.authors = strNewValue;
    }
  }
  if (objResultItem.Title)
  {
    debug("Amazon Web Service Title (raw) = %j",objResultItem.Title);
    var strNewValue = objResultItem.Title;
    // Amazon post-processing: guess series, if any
    var arrMatchSeries = strNewValue.match(/^(.*)\(La série de livres ([^)]+)\)(.*)$/);
    if (arrMatchSeries == null)
    {
      arrMatchSeries = strNewValue.match(/^(.*)Collection ([^:]+):(.*)$/);
    }
    if (arrMatchSeries)
    {
      debug("Amazon Web Service Title / Serie = %s / %s",arrMatchSeries[1], arrMatchSeries[2]);
      strNewValue = (arrMatchSeries[1] == null ? "" : arrMatchSeries[1].replace(/^ +/, " ").replace(/ +$/, "")) + (arrMatchSeries[3] == null ? "" : arrMatchSeries[3].replace(/^ +/, " ").replace(/ +$/, ""));
      if (arrMatchSeries[2] != null && arrMatchSeries[2] != "")
      {
        objWebServiceResult.series_title = arrMatchSeries[2].replace(/^ +/, "").replace(/ +$/, "");
      }
    }
    // Remove bad UTF-8 encoding for SOME books (!)
    if (strNewValue.match(/Ã/))
    {
      strNewValue = strNewValue.replace(/Ã®/g, "î").replace(/Ã©/g, "é").replace(/Ã¨/g, "è").replace(/Ã /g, "à").replace(/Ã¹/g, "ù");
    }

    // Remove some annoyance like "French Edition" or "De 5 à 7 ans" (UTF8), trailing spaces...
    strNewValue = strNewValue.replace(/ *\(French Edition\)/, "").replace(/ *- De [0-9]+ ..? [0-9]+ ans/, "").replace(/^ +/, "").replace(/ +$/, "");

    debug("Amazon Web Service Title (processed) = %s",strNewValue);
    // WARNING: don't overwrite result from another Web Service, unless this result is longuer (ok, it's a silly way to finding the most appropriate answer) and well-encoded (not UTF8 garbage from AWS)
    if (objWebServiceResult.title == null || (objWebServiceResult.title.length < strNewValue.length && strNewValue.match(/Ã/) == null ))
    {
      objWebServiceResult.title = strNewValue;
    }
  }
  /* TODO Description ?
  if (objResultItem.description)
  {
    objWebServiceResult.description = objResultItem.description;
  }
  */
  objWebServiceResult.isbn = strISBN;
  // TODO handle publisher? language? hyperlink to more information on amazon?
  objWebServiceResult.status = "OK";
}

// GET menu
router.get('/', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  res.render('item/index', { title: req.app.locals.title, subtitle: null, menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu) });

});
// Get list
router.get('/list', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  db.list_record(req, res, next, objMyContext.objFormParameters, null /* objSQLOptions */, function(err, result, fields) {
    if (err) throw err;
    // Display records with "list" template
    res.render('item/list', { title: req.app.locals.title, subtitle: req.i18n.__("Liste"), menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objFormParameters, records:result });
  });

});





// ************************************************************************************* NEW
// GET new (form)
router.get('/new', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  res.render('item/new', {req:req, title: req.app.locals.title, subtitle: null, menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objFormParameters, message:{text:req.i18n.__("Veuillez remplir le formulaire"),type:"info"}, action:"new"});

});
// POST new (form validation then insert new record in database)
router.post('/new', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  var objSQLConnection = db.new_connection();
  if (req.body["_CANCEL"] != null)
  {
    // Cancel insert : Redirect to menu
    res.redirect('./');
  } // if (req.body["_CANCEL"] != null)
  else if (req.body["_OK"] != null)
  {
    // Check that this book is not already in inventory - if it is, propose to add a new copy
    debug("req.body = %j", req.body);
    var strISBN = req.body["isbn13"];
    var strSQLWhere = "isbn13 = "+objSQLConnection.escape(strISBN);
    if (strISBN == null || strISBN == "")
    {
      // No ISBN : check book title + author
      strSQLWhere = "title = "+objSQLConnection.escape(req.body["title"]) + " AND author = "+objSQLConnection.escape(req.body["author"]);
    }
    db.runsql("SELECT * FROM item_detail WHERE "+strSQLWhere+";", function(err, arrRows, fields) {
      if (err)
      {
        throw err;
      }
      else
      {
        if (arrRows && arrRows.length > 0)
        {
          // Book already exists with same ISBN: propose to add a copy
          var row = db.rows(arrRows);
          res.render('item/new_copy',
                     {
                       req:req, title: req.app.locals.title, subtitle: null,
                       menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu),
                       form:objMyContext.objFormParameters,
                       message:{text:req.i18n.__("Ce livre est déjà dans l'inventaire. Voulez-vous ajouter un exemplaire?"),type:"warning"},
                       action:"new_copy",
                       record:row
                     }
                   );
        }
        else
        {
          // Not found - book does not exists yet, add it with one copy
          db.insert_record(req, res, next, objMyContext.objFormParameters, function(err, result, fields, objSQLConnection) {
            if (err)
            {
              if (objSQLConnection)
              {
                objSQLConnection.end();
              }
              db.handle_error(err, res, req, "item/new",
                              { req:req, title: req.app.locals.title, subtitle: null, menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu),
                                form:objMyContext.objFormParameters, message:{text:req.i18n.__("Ce livre est déjà dans l'inventaire (%s)",err),type:"error"}, action:"new" });
            }
            else
            {
              // Always add at least ONE copy of the book (item => item_detail)
              db.runsql("INSERT INTO item(item_detail_id) VALUES(IF (@last_insert_id IS NULL, LAST_INSERT_ID(), @last_insert_id));" /* strSQL */, function(err, arrRows, fields) {
                if (objSQLConnection)
                {
                  objSQLConnection.end();
                }
                if (err) throw err;
                // Display add form again
                res.render('item/new',
                           {
                             req:req, title: req.app.locals.title, subtitle: null, menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu),
                             form:objMyContext.objFormParameters, message:{text:req.i18n.__("Fiche ajoutée avec succès. Veuillez remplir la fiche suivante"),type:"info"}, action:"new"});
              }, objSQLConnection, true /* blnLogIt */);

            }
          });
        }
      }

    }, objSQLConnection, false /* blnLogIt */);

  } // else if (req.body["_CANCEL"] != null)
  else
  {
    // Neither _OK nor _CANCEL: error!
    throw new Error("ERROR: Invalid form state (must be _OK or _CANCEL)");
  }

});

// POST new_copy (form validation then insert new copy in database - item)
router.post('/new_copy', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  if (req.body["_CANCEL"] != null)
  {
    // Cancel insert : Redirect to menu
    res.redirect('./');
  } // if (req.body["_CANCEL"] != null)
  else if (req.body["_OK"] != null)
  {
    // Always add at least ONE copy of the book (item => item_detail)
    var strItemDetailId = req.body["id"];
    var intItemDetailId = parseInt(strItemDetailId,10);
    db.runsql("INSERT INTO item(item_detail_id) VALUES("+intItemDetailId.toString(10)+");" /* strSQL */, function(err, arrRows, fields, objSQLConnection) {
      if (objSQLConnection)
      {
        objSQLConnection.end();
      }
      if (err) throw err;
      // Display add form again
      res.render('item/new', {
                               req:req,
                               title: req.app.locals.title, subtitle: null, menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu),
                               form:objMyContext.objFormParameters, message:{text:req.i18n.__("Exemplaire ajouté avec succès. Veuillez remplir la fiche suivante"),type:"info"}, action:"new"});
    }, null /* objSQLConnection */, true /* blnLogIt */);

  } // else if (req.body["_OK"] != null)
  else if (req.body["_COPY_ADD"] != null || req.body["_COPY_DEL"] != null)
  {
    // Add or remove a copy of the book (item => item_detail)
    var blnDel = (req.body["_COPY_DEL"] != null);
    var strItemDetailId = req.body["id"];
    var intItemDetailId = parseInt(strItemDetailId,10);
    if (isNaN(intItemDetailId))
    {
      throw new Error("Invalid parameter id=\""+strItemDetailId+"\"!");
    }
    var strSQL = "INSERT INTO item(item_detail_id) VALUES("+intItemDetailId.toString(10)+");";
    if (blnDel)
    {
      // Delete ONE copy (LIMIT 1) - should use a specific item.id (to remove a specific copy of the book - should be using its unique id)
      strSQL = "DELETE FROM item WHERE item_detail_id = "+intItemDetailId.toString(10)+" LIMIT 1;";
    }
    db.runsql(strSQL /* strSQL */, function(err, arrRows, fields, objSQLConnection) {
      if (err)
      {
        if (objSQLConnection)
        {
          objSQLConnection.end();
        }
        throw err;
      }
      if (blnDel)
      {
        // Removed a copy - check if there's on left (if not, display item menu)
        db.runsql("SELECT COUNT(1) AS nb FROM item WHERE item_detail_id = "+intItemDetailId.toString(10)+";" /* strSQL */, function(err, arrRows, fields, objSQLConnection) {
          if (objSQLConnection)
          {
            objSQLConnection.end();
          }
          if (err) throw err;
          debug("arrRows = %j", arrRows);
          if (arrRows && arrRows[0] && arrRows[0].nb > 0)
          {
            // There's at least one copy left - redirect to view page
            res.redirect("view?id="+encodeURIComponent(intItemDetailId.toString(10)));
          }
          else
          {
            // No copies left: Redirect to menu
            res.redirect('./');
          }

        }, objSQLConnection, false /* blnLogIt */);
        if (objSQLConnection)
        {
          objSQLConnection.end();
        }
      }
      else
      {
        if (objSQLConnection)
        {
          objSQLConnection.end();
        }
        // Display view form again
        res.redirect("view?id="+encodeURIComponent(intItemDetailId.toString(10)));
      }
    }, null /* objSQLConnection */, true /* blnLogIt */);

  } // else if (req.body["_OK"] != null)
  else
  {
    // Neither _OK nor _CANCEL: error!
    throw new Error("ERROR: Invalid form state (must be _OK or _CANCEL)");
  }

});




// ************************************************************************************* UPDATE
// POST update (form validation then update all fields in database)
router.post('/update', function(req, res, next) {

  debug("item/update: req.body = %j", req.body);

  var objMyContext = new module_context(req, res, next);
  if (req.body["_CANCEL"] != null)
  {
    // Cancel : Redirect to menu
    res.redirect('./');
  } // if (req.body["_CANCEL"] != null)
  else if (req.body["_OK"] != null)
  {
    db.update_record(req, res, next, objMyContext.objFormParameters, function(err, result, fields, objSQLConnection) {
      if (objSQLConnection)
      {
        objSQLConnection.end();
      }
      if (err)
      {
        db.handle_error(err, res, req, "item/update", { title: req.app.locals.title, subtitle: null, menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objFormParameters, message:"Impossible de modifier ce livre ("+err+")" });
      }
      else
      {
        // Redirect to menu
        res.redirect('./');
      }
    });
  } // else if (req.body["_CANCEL"] != null)
  else
  {
    // Neither _OK nor _CANCEL: error!
    throw new Error("ERROR: Invalid form state (must be _OK or _CANCEL)");
  }

});





// ************************************************************************************* DELETE
// POST delete (form validation then delete record in database)
router.post('/delete', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  if (req.body["_CANCEL"] != null)
  {
    // Cancel : Redirect to menu
    res.redirect('./');
  } // if (req.body["_CANCEL"] != null)
  else if (req.body["_OK"] != null)
  {
    db.delete_record(req, res, next, objMyContext.objFormParameters, function(err, result, fields, objSQLConnection) {
      if (objSQLConnection)
      {
        objSQLConnection.end();
      }
      if (err)
      {
        db.handle_error(err, res, req, "item/delete", { title: req.app.locals.title, subtitle: null, menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objFormParameters, message:"Impossible d'effacer ce livre ("+err+")" });
      }
      else
      {
        // Redirect to menu
        res.redirect('./');
      }
    });
  } // else if (req.body["_CANCEL"] != null)
  else
  {
    // Neither _OK nor _CANCEL: error!
    throw new Error("ERROR: Invalid form state (must be _OK or _CANCEL)");
  }

});





// ************************************************************************************* VIEW
// GET view
router.get('/view', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  db.view_record(req, res, next, objMyContext.objFormParameters, function(err, arrRows, fields) {
    if (err) throw err;
    debug("arrRows = %j", arrRows);
    var results = db.rows(arrRows, {only_last:false});
    debug("results = %j", results);
    var result = results[0][0];
    debug("result = %j", result);
    var counter = results[1][0];
    debug("counter = %j", counter);
    var strFormInfo = req.i18n.__("Exemplaires : %d", counter.counter);
    var strFormInfoType = (counter.counter <= 0 || counter.borrowed == counter.counter ? "warning" : "info");
    var strURLCopies = "new_copy?item_detail_id="+encodeURIComponent(result.id);
    var strURLCopiesAdd = strURLCopies+"&action="+encodeURIComponent("1");
    var strURLCopiesRemove = strURLCopies+"&action="+encodeURIComponent("-1");
    var strImageLink = "/item/webservice/img?id="+encodeURIComponent(result.id.toString(10)) + (result && result.img_url ? "&url="+encodeURIComponent(result.img_url) : "");
    // Display first record with "view" template
    res.render('item/view', {
      title: req.app.locals.title,
      subtitle: req.i18n.__("Fiche"),
      menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu),
      form:objMyContext.objFormParameters,
      record:result,
      message:null,
      form_id:result.id,
      form_info:{ type:strFormInfoType, text:strFormInfo },
      form_custom_html:'<button id="_COPY_ADD" name="_COPY_ADD" type="submit" class="btn btn-default">+1</button>&#32;<button id="_COPY_DEL" name="_COPY_DEL" type="submit" class="btn btn-default">-1</button>',
      img_url: strImageLink
    });
  });

});





// ************************************************************************************* WEB SERVICES
// GET web service (fetch isbn information)
router.get('/webservice', function(req, objLocalWebServiceResult, next) {

  var objMyContext = new module_context(req, objLocalWebServiceResult, next);
  var objWebServiceResult = {status:"KO"};

  // Must be something in the body
  if (!req.body)
  {
    console.log("ERROR: Web Service called with an empty body");
    return objLocalWebServiceResult.sendStatus(400);
  }

  debug("req.query.isbn=%s\n",req.query.isbn);

  var strISBN = req.query.isbn;
  // ISBN must not be empty
  if (strISBN == null || strISBN == "")
  {
    console.log("ERROR: Web Service called with an empty isbn parameter");
    return objLocalWebServiceResult.sendStatus(400);
  }
  var strServerPort = req.app.get('port');
  var strServerHostPort = req.headers['host'];
  if (strServerHostPort == "" || strServerHostPort == null)
  {
    strServerHostPort = "localhost:"+strServerPort;
  }

  const urls= [
    "http://xisbn.worldcat.org/webservices/xid/isbn/"+encodeURIComponent(strISBN)+"?method=getMetadata&format=json&fl="+encodeURIComponent('*'),
    "https://www.googleapis.com/books/v1/volumes?q=isbn:"+encodeURIComponent(strISBN),
    /* TODO : fetch api key from configuration */
    "https://www.goodreads.com/search.xml?key=VaCw4UGPa9vUTlncfWfg&q="+encodeURIComponent(strISBN),
    "http://" + strServerHostPort + "/item/aws?isbn="+encodeURIComponent(strISBN)
  ];
  async.map(urls, function (url, callback) {
    console.log("Calling Web Service "+url);
    const options = {
      url :  url,
      json : true
    };
    request(options,
      function(err, res, body) {
        debug("Body = %j",body);
        var objSQLConnection = db.new_connection();
        var objResult = body;
        if (res.headers['content-type'] && res.headers['content-type'].match(/(application|text)\/xml/))
        {
          // Result contains XML: convert it to JSON automatically
          xml2js.parseString(objResult, {trim: true}, function (err, objResultJSON) {
          db.runsql("\
INSERT INTO log(`date_time`, `type`, `label`, `request`, `result`) \n\
VALUES (\n\
  NOW(), 'WEBSERVICE', "+objSQLConnection.escape("ISBN Web Service")+", "+objSQLConnection.escape(url)+",COMPRESS("+objSQLConnection.escape(JSON.stringify(objResultJSON))+") \n\
)\n\
;\n\
" /* strSQL */, null /* fnCallback */, objSQLConnection, false /* blnLogIt */);
            callback(err, objResultJSON);
          });
        }
        else
        {
          db.runsql("\
INSERT INTO log(`date_time`, `type`, `label`, `request`, `result`) \n\
VALUES (\n\
  NOW(), 'WEBSERVICE', "+objSQLConnection.escape("ISBN Web Service")+", "+objSQLConnection.escape(url)+",COMPRESS("+objSQLConnection.escape(JSON.stringify(objResult))+") \n\
)\n\
;\n\
" /* strSQL */, null /* fnCallback */, objSQLConnection, false /* blnLogIt */);
            callback(err, objResult);
          }

        }
    );
  }, function (err, res) {

    // Handle errors gracefully
    if (err)
    {
      objLocalWebServiceResult.status = "KO";
      objLocalWebServiceResult.message = err;
      objLocalWebServiceResult.json(objWebServiceResult);
    }

    debug("res=%j\n",res);

    if (res && res.length > 0)
    {
      // Response is ok : build a custom object for replying (with only the first item)
      for (var intResult in res)
      {
        debug("res[intResult]=%j\n",res[intResult]);

        if (res[intResult].stat)
        {
          // Worldcat result
          if (res[intResult].stat == "ok" && res[intResult].list && res[intResult].list.length >0)
          {
            var objResultItem = res[intResult].list[0]; // TODO Handle multiple results? (let the user pick one?)
            if (objResultItem.author)
            {
              var strNewValue = objResultItem.author; // TODO Handle multiple authors?
              // WARNING: don't overwrite result from another Web Service, unless this result is longuer (ok, it's a silly way to finding the most appropriate answer)
              if (objWebServiceResult.authors == null || objWebServiceResult.authors.length < strNewValue.length)
              {
                objWebServiceResult.authors = strNewValue;
              }
            }
            if (objResultItem.title)
            {
              objWebServiceResult.title = objResultItem.title;
            }
            if (objResultItem.isbn && objResultItem.isbn.length > 0 && objResultItem.isbn[0])
            {
              objWebServiceResult.isbn = objResultItem.isbn[0]; // TODO Handle multiple ISBN?
            }
            // TODO handle description? publisher? language? hyperlink to more information on google?
            objWebServiceResult.status = "OK";
          }
          else
          {
            // Worldcat error : ignore it
            console.log("Worldcat error : ignore it");
          }
        }
        else if (res[intResult].kind)
        {
          // Google result
          if (res[intResult].totalItems > 0 && res[intResult].items.length && res[intResult].items[0].volumeInfo)
          {
            var objResultItem = res[intResult].items[0].volumeInfo; // TODO Handle multiple results? (let the user pick one?)
            if (objResultItem.authors)
            {
              var strNewValue = objResultItem.authors.join(", ");
              // WARNING: don't overwrite result from another Web Service, unless this result is longuer (ok, it's a silly way to finding the most appropriate answer)
              if (objWebServiceResult.authors == null || objWebServiceResult.authors.length < strNewValue.length)
              {
                objWebServiceResult.authors = strNewValue;
              }
            }
            if (objResultItem.title)
            {
              objWebServiceResult.title = objResultItem.title;
            }
            if (objResultItem.description)
            {
              objWebServiceResult.description = objResultItem.description;
            }
            if (objResultItem.industryIdentifiers && objResultItem.industryIdentifiers.length > 0)
            {
              for (var intID in objResultItem.industryIdentifiers)
              {
                if (objResultItem.industryIdentifiers[intID].type == "ISBN_13")
                {
                  objWebServiceResult.isbn = objResultItem.industryIdentifiers[intID].identifier;
                }
              }
            }
            // TODO handle publisher? language? hyperlink to more information on google?
            objWebServiceResult.status = "OK";
          }
          else
          {
            // Google error : ignore it
            console.log("Google error : ignore it");
          }
        }
        else if (res[intResult].ItemLookupResponse || res[intResult].ItemLookupErrorResponse)
        {
          // Amazon Web Service result
          if (res[intResult].ItemLookupResponse && res[intResult].ItemLookupResponse.Items && res[intResult].ItemLookupResponse.Items.Item)
          {
            // Handle one or more results (build aggregated result)
            var objResults = res[intResult].ItemLookupResponse.Items.Item;
            if (objResults.length == null || objResults.length == 0)
            {
              debug("one result: objResults= %j", objResults);
              // One result only - Item is an object
              aws_post_processing(strISBN, objResults.ItemAttributes, objWebServiceResult);
            }
            else
            {
              debug("multiple results: objResults= %j", objResults);
              // Multiples results - Item is an Array of objects
              for (var intItem = 0; intItem < objResults.length; intItem++)
              {
                var objResultItem = objResults[intItem].ItemAttributes;
                aws_post_processing(strISBN, objResultItem, objWebServiceResult);
              } // for (var intItem = 0; intItem < objResults.length; intItem++)

            } // if (objResults.length == null || objResults.length == 0)

          }
          else
          {
            // Amazon Web Service error : ignore it
            console.log("Amazon Web Service error : ignore it");
          }
        }
        else if (res[intResult].GoodreadsResponse)
        {
          // Goodreads answer
          if (res[intResult].GoodreadsResponse.search 
              && res[intResult].GoodreadsResponse.search.length > 0
              && res[intResult].GoodreadsResponse.search[0].results
              && res[intResult].GoodreadsResponse.search[0].results.length > 0
              && res[intResult].GoodreadsResponse.search[0].results[0].work
              && res[intResult].GoodreadsResponse.search[0].results[0].work.length > 0
              && res[intResult].GoodreadsResponse.search[0].results[0].work[0].best_book
              && res[intResult].GoodreadsResponse.search[0].results[0].work[0].best_book.length > 0
              )
          {
            var objResultItem = res[intResult].GoodreadsResponse.search[0].results[0].work[0].best_book[0]; // TODO Handle multiple results? (let the user pick one?)
            if (objResultItem && objResultItem.author && objResultItem.author.length > 0 && objResultItem.author[0].name)
            {
              var strNewValue = objResultItem.author[0].name[0]; // TODO Handle multiple authors?
              // WARNING: don't overwrite result from another Web Service, unless this result is longuer (ok, it's a silly way to finding the most appropriate answer)
              if (objWebServiceResult.authors == null || objWebServiceResult.authors.length < strNewValue.length)
              {
                objWebServiceResult.authors = strNewValue;
              }
            }
            if (objResultItem && objResultItem.title)
            {
              objWebServiceResult.title = objResultItem.title[0];
            }
            // Handle image_url, small_image_url and possibly "large" image url
            var arrLargeImageURLs = [];
            var arrMediumImageURLs = objResultItem.image_url;
            var arrSmallImageURLs = objResultItem.small_image_url;

            if (arrMediumImageURLs && arrMediumImageURLs.length >= 1)
            {
              if (arrMediumImageURLs[0].match(/\/nophoto\//))
              {
                // No Gooreads picture: clear all
                arrMediumImageURLs = null;
                arrLargeImageURLs = null;
                arrSmallImageURLs = null;
              }
              else if (arrMediumImageURLs[0].match(/[0-9]+m\/[0-9]+/))
              {
                // URL contains "m" for "medium size", try to guess large image (replace "m"" by "l)
                arrLargeImageURLs.push(arrMediumImageURLs[0].replace(/([0-9]+)m\/([0-9]+)/, "$1l/$2"))
              }
            }
            objWebServiceResult.status = "OK";
            if (arrLargeImageURLs)
            {
              objWebServiceResult.image_urls = arrLargeImageURLs.concat(arrMediumImageURLs, arrSmallImageURLs);
            }
          }
          else
          {
            // Goodreads error : ignore it
            console.log("Goodreads error : ignore it");
          }
          
        }
        else
        {
          // Unknown format - fatal error
          objWebServiceResult.message = "Unknown format: can't find book with isbn \""+strISBN+"\"";
        }

      } // for (var intResult in res)

      // If no web service returned a result, set a generic error message
      if (objWebServiceResult.status == "KO")
      {
        objWebServiceResult.message = "Unknown error: can't find book with isbn \""+strISBN+"\"";
      }

      debug("objWebServiceResult=%j", objWebServiceResult);

      // Log final result
      var objSQLConnection = db.new_connection();
      var strURL = "http://" + strServerHostPort + "/item/webservice?isbn="+encodeURIComponent(strISBN);
      db.runsql("\
INSERT INTO log(`date_time`, `type`, `label`, `request`, `result`) \n\
VALUES (\n\
  NOW(), 'WEBSERVICE', "+objSQLConnection.escape("ISBN Web Service (final)")+", "+objSQLConnection.escape(strURL)+",COMPRESS("+objSQLConnection.escape(JSON.stringify(objWebServiceResult))+") \n\
)\n\
;\n\
" /* strSQL */, null /* fnCallback */, objSQLConnection, false /* blnLogIt */);

      // Nettoyage
      if (objSQLConnection)
      {
        objSQLConnection.end();
      }

      // Return final result
      objLocalWebServiceResult.json(objWebServiceResult);

    } // if (res && res.length > 0)

  });

});

// GET info from Amazon Web Service (fetch isbn information with Amazon ID/Password)
router.get('/aws', function(req, objLocalWebServiceResult, next) {

  debug("webservice/aws");
  var objMyContext = new module_context(req, objLocalWebServiceResult, next);
  var objWebServiceResult = {status:"KO"};

  // Must be something in the body
  if (!req.body)
  {
    console.log("ERROR: Web Service called with an empty body");
    return objLocalWebServiceResult.sendStatus(400);
  }

  debug("req.query.isbn=%s\n",req.query.isbn);

  var strISBN = req.query.isbn;
  // ISBN must not be empty
  if (strISBN == null || strISBN == "")
  {
    console.log("ERROR: Web Service called with an empty isbn parameter");
    return objLocalWebServiceResult.sendStatus(400);
  }

  objAWSOpHelper.execute('ItemLookup', {
      'IdType': 'ISBN',
      'ItemId': strISBN,
      'SearchIndex': 'Books',
      'ResponseGroup': 'ItemAttributes'
  }, function(error, results) {
      if (error)
      {
        console.log('Error: ' + error + "\n")
        objLocalWebServiceResult.status = "KO";
        objLocalWebServiceResult.message = error;
        objLocalWebServiceResult.json(results);
      }
      else
      {
        debug("Results: %j\n", results);
        objLocalWebServiceResult.status = "OK";
        objLocalWebServiceResult.message = "OK";
        objLocalWebServiceResult.json(results);
      }
  });

});



// ************************************************************************************* SEARCH
// GET search (form)
router.get('/search', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  res.render('item/new', {req:req, title: req.app.locals.title, subtitle: req.i18n.__("Recherche"), menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objSearchParameters, message:{text:req.i18n.__("Veuillez remplir le formulaire"),type:"info"}, action:"search"});

});
// POST search (form validation then search records in database)
router.post('/search', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  if (req.body["_CANCEL"] != null)
  {
    // Cancel insert : Redirect to menu
    res.redirect('./');
  } // if (req.body["_CANCEL"] != null)
  else if (req.body["_OK"] != null)
  {
    db.search_record(req, res, next, objMyContext.objSearchParameters, null /* objSQLOptions */, function(err, result, fields) {
      if (err) throw err;
      // Display records with "list" template
      res.render('item/list', { title: req.app.locals.title, subtitle: req.i18n.__("Liste"), menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objFormParameters, records:result });
    });
  } // else if (req.body["_CANCEL"] != null)
  else
  {
    // Neither _OK nor _CANCEL: error!
    throw new Error("ERROR: Invalid form state (must be _OK or _CANCEL)");
  }

});


// ************************************************************************************* WEB SERVICES
// Web Service returning items classification
router.get('/webservice/items', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  var objSQLConnection = db.new_connection();

  debug("/webservice/items:req.query=%j", req.query);
  var strSQLWhere1 = null;
  var strSQLWhere2 = null;
  var strSQLWhere3 = null;
  if (req.query.text)
  {
    var strValue = req.query.text;
    var strSQLText = objSQLConnection.escape(strValue);
    var strSQLTextStartWith = objSQLConnection.escape(strValue+"%");
    var strSQLTextContain = objSQLConnection.escape("%"+strValue+"%");
    strSQLWhere1 = " MATCH(item_classification.label) AGAINST ("+strSQLText+" IN BOOLEAN MODE)\n";
    strSQLWhere2 = " item_classification.label LIKE "+strSQLTextStartWith+"\n";
    strSQLWhere3 = " item_classification.label LIKE "+strSQLTextContain+"\n";
  }
  if (req.query && req.query.action == "classification")
  {
    // Custom SQL, list of items not already borrowed (LEFT OUTER JOIN borrow ... WHERE borrow.id IS NULL)
    var arrSQL = ["\
DROP TEMPORARY TABLE IF EXISTS tmp_classification\n\
; \n","\
CREATE TEMPORARY TABLE tmp_classification(id INTEGER NOT NULL AUTO_INCREMENT PRIMARY KEY, `text` TEXT NOT NULL)\n\
; \n","\
INSERT IGNORE INTO tmp_classification(id,`text`) \n\
SELECT item_classification.id AS `id`, CONCAT_WS(\', \', item_classification.label) AS `text`  \n\
  FROM item_classification\
  "+(strSQLWhere1 == null ? "" : "\nWHERE "+strSQLWhere1)+"\
; \n\
"
    ];
    if (strSQLWhere2 != null)
    {
      arrSQL.push("\
INSERT IGNORE INTO tmp_classification(id,`text`) \n\
SELECT item_classification.id AS `id`, CONCAT_WS(\', \', item_classification.label) AS `text`  \n\
FROM item_classification \n\
WHERE "+strSQLWhere2+"\
; \n\
");
    } // if (strSQLWhere2 != null)
    if (strSQLWhere3 != null)
    {
      arrSQL.push("\
INSERT IGNORE INTO tmp_classification(id,`text`) \n\
SELECT item_classification.id AS `id`, CONCAT_WS(\', \', item_classification.label) AS `text`  \n\
FROM item_classification \n\
WHERE "+strSQLWhere3+"\
; \n\
");
    } // if (strSQLWhere2 != null)
    arrSQL.push("\
SELECT * FROM tmp_classification \n\
; \n");
    arrSQL.push("\
DROP TEMPORARY TABLE IF EXISTS tmp_classification \n\
; \n");

    db.runsql(arrSQL, function(err, arrRows, fields, objSQLConnection) {
      if (err)
      {
        // Cleanup
        if (objSQLConnection)
        {
          objSQLConnection.end();
        }
        throw err;
      }
      // Fetch rows returning a value only
      var rows = db.rows(arrRows);
      // Return result as JSON
      debug("/webservice/items/classification:rows=%j", rows);
      res.json(rows);
    }, objSQLConnection, false /* blnLogIt */);
  } // if (req.query && req.query.action == "classification")
  else
  {
    throw new Error(req.i18n.__("ERROR: Action \"%s\" is not supported!",req.query.action));
  } // else if (req.query && req.query.action == "classification")

  // Cleanup
  if (objSQLConnection)
  {
    objSQLConnection.end();
  }

});
// Web Service returning items image
router.get('/webservice/img', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  var objSQLConnection = db.new_connection();

  debug("/webservice/img:req.query=%j", req.query);

  // Use a local file cache for requested URL
  var intItemDetailId = req.query.id;
  if (req.query.url)
  {
    var strImageFilePath = db.img_file(intItemDetailId, path.extname(req.query.url));
    var strImageVirtualPath = db.img_virtual_path(intItemDetailId, path.extname(req.query.url));
    if (fs.existsSync(strImageFilePath))
    {
      // Redirect to virtual path
      debug("Redirect to local virtual path %s", strImageVirtualPath);
      res.redirect(strImageVirtualPath);
    }
    else
    {
      // Simple redirection to get image
      debug("Redirect to external path %s", req.query.url);
      res.redirect(req.query.url);
      // And download external image in local cache for next call
      item_image_save_to_local_cache(req.query.url, strImageFilePath, intItemDetailId);
    }
  } // if (req.query.url)
  else
  {
    // TODO Try to fetch image URL from isbn (live or from previous calls)
  } // else if (req.query.url)

  return(res.sendStatus(404)); // Not found
});

// Download external image in local cache for further use
function item_image_save_to_local_cache(strImageURL, strImageFilePath, intItemDetailId)
{
  // Call HEAD method to check that URL exists
  request.head(strImageURL,
    function(err, res, body) {
      if (err)
      {
        console.log("ERROR: Can't find URL %s for item id %d : %s", strImageURL, intItemDetailId, err);
      }
      else
      {
        console.log("Image found at URL %s for item id %d", strImageURL, intItemDetailId);
        var strContentType = res.headers['content-type'];
        // TODO Check content type (must be image/something)
        var strContentLength = res.headers['content-length'];
        if (strContentLength != null)
        {
          var intContentLength = parseInt(strContentLength, 10);
          if (isNaN(intContentLength) || intContentLength == 0)
          {
            console.log("ERROR: Invalid content-type \"%s\"from URL %s for item id %d : %s", strContentLength, strImageURL, intItemDetailId);
          }
        }
        var strDate = res.headers['date'];
        var strLastModifided = res.headers['last-modified'];
        // TODO : if local file date is after 'last-modified', don't download it again (otherwise DO the download)
        
        console.log('content-type:', strContentType);
        console.log('content-length:', strContentLength);
        console.log('headers = %j', res.headers);
        // Save image in local cache (public/img/item/00/00/00/00/0000000001.jpg)
        var strImageFolder = db.img_folder(intItemDetailId);
        console.log("Saving to cache image file : \"%s\"", strImageFilePath);
        mkdirp.sync(strImageFolder);
        request({url : strImageURL, encoding: null /* We expect binary data */}).pipe(fs.createWriteStream(strImageFilePath));
      }
    }
  );
}

module.exports = router;
