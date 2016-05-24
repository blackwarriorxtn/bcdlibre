var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var db = require('./db'); // database utilities
var request = require('request');
var async = require('async');
var config = require('../setup/config.js');

var strAWSId = config.webservices.aws.awsId;
var strAWSSecret = config.webservices.aws.awsSecret;
var strAWSAssocId = config.webservices.aws.assocId;


// ******************************************************************************** item
function module_context(req, res, next)
{
  // *** PARAMETERS (SQL)
  this.objFormParameters = {
    table_name: "item_detail",
    primary_key: ["id"],
    autoincrement_column: "id",
    fields:[
      {name:"id",label:"#",type:"String",required:false,validation:null},
      /* NOTE: we use a maximum length of 16 to let user copy/paste full ISBN with dashes or spaces, then normalize it to 13 characters */
      {name:"isbn13",label:req.i18n.__("Numéro ISBN"),type:"String",required:false,validation:null,maximum_length:16},
      {name:"title",label:req.i18n.__("Titre"),type:"String",required:true,validation:null,maximum_length:255},
      {name:"author",label:req.i18n.__("Auteur"),type:"String",required:true,validation:null,maximum_length:255},
      {name:"classification",label:req.i18n.__("Classification"),type:"String",required:false,validation:null,maximum_length:255},
      {name:"series_title",label:req.i18n.__("Série"),type:"String",required:false,validation:null,maximum_length:255,autoreplay:true},
      {name:"description",label:req.i18n.__("Description (Synopsis)"),type:"String",required:false,validation:null,maximum_length:65535},
    ]
  };
  // To search we only have ONE field named "search" and a special SQL table with full text indexes
  this.objSearchParameters = {
    table_name: this.objFormParameters.table_name+"_search",
    primary_key: this.objFormParameters.primary_key,
    autoincrement_column: this.objFormParameters.autoincrement_column,
    list_fields:"item_detail_id AS id, title, author, description, isbn13, series_title",
    fields:[
      {
        name:"search",label:req.i18n.__("Titre, Auteur, Description"),type:"String",required:true,validation:null,maximum_length:255,
        match_fields:[
          "title",
          "author",
          "description"
        ]
      },
    ]
  };
  // *** PARAMETERS (MENU)
  this.objMenu = [{text:req.i18n.__("Gérer"),link:"/manage/"},{text:req.i18n.__("Livres"),link:"/item/"}];
  this.objMainMenu = {text:req.i18n.__("Menu principal"),link:"/"};
}

function aws_post_processing(strISBN, objResultItem, objWebServiceResult)
{
  // DEBUG
  console.log("Amazon Web Service result: %j", objResultItem);
  if (objResultItem.Author)
  {
    var strNewValue = objResultItem.Author;
    // DEBUG console.log("Amazon Web Service Authors = %s",strNewValue);
    // WARNING: don't overwrite result from another Web Service, unless this result is longuer (ok, it's a silly way to finding the most appropriate answer)
    if (objWebServiceResult.authors == null || objWebServiceResult.authors.length < strNewValue.length)
    {
      objWebServiceResult.authors = strNewValue;
    }
  }
  if (objResultItem.Title)
  {
    // DEBUG
    console.log("Amazon Web Service Title (raw) = %j",objResultItem.Title);
    var strNewValue = objResultItem.Title;
    // Amazon post-processing: guess series, if any
    var arrMatchSeries = strNewValue.match(/^(.*)\(La série de livres ([^)]+)\)(.*)$/);
    if (arrMatchSeries == null)
    {
      arrMatchSeries = strNewValue.match(/^(.*)Collection ([^:]+):(.*)$/);
    }
    if (arrMatchSeries)
    {
      // DEBUG
      console.log("Amazon Web Service Title / Serie = %s / %s",arrMatchSeries[1], arrMatchSeries[2]);
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

    // DEBUG
    console.log("Amazon Web Service Title (processed) = %s",strNewValue);
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
  if (req.body["_CANCEL"] != null)
  {
    // Cancel insert : Redirect to menu
    res.redirect('./');
  } // if (req.body["_CANCEL"] != null)
  else if (req.body["_OK"] != null)
  {
    db.insert_record(req, res, next, objMyContext.objFormParameters, function(err, result, fields, objSQLConnection) {
      if (err)
      {
        if (objSQLConnection)
        {
          objSQLConnection.end();
        }
        db.handle_error(err, res, req, "item/new", { req:req, title: req.app.locals.title, subtitle: null, menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objFormParameters, message:{text:"Ce livre est déjà dans l'inventaire ("+err+")",type:"error"}, action:"new" });
      }
      else
      {
        // Always add at least ONE exemplary of the book (item => item_detail)
        db.runsql("INSERT INTO item(item_detail_id) VALUES(LAST_INSERT_ID());" /* strSQL */, function(err, arrRows, fields) {
          if (objSQLConnection)
          {
            objSQLConnection.end();
          }
          if (err) throw err;
          // Display add form again
          var objMyContext = new module_context(req, res, next);
          res.render('item/new', {req:req, title: req.app.locals.title, subtitle: null, menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objFormParameters, message:{text:"Fiche ajoutée avec succès. Veuillez remplir la fiche suivante",type:"info"}, action:"new"});
        }, objSQLConnection);

      }
    });
  } // else if (req.body["_CANCEL"] != null)
  else
  {
    // Neither _OK nor _CANCEL: error!
    throw new Error("ERROR: Invalid form state (must be _OK or _CANCEL)");
  }

});





// ************************************************************************************* UPDATE
// POST update (form validation then update all fields in database)
router.post('/update', function(req, res, next) {

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
        // Redirect to list
        res.redirect('list');

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
        // Redirect to list
        res.redirect('list');

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
  db.view_record(req, res, next, objMyContext.objFormParameters, function(err, result, fields) {
    if (err) throw err;
    // Display first record with "view" template
    res.render('item/view', { title: req.app.locals.title, subtitle: req.i18n.__("Fiche"), menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objFormParameters, record:result[0], message:null });
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

  // DEBUG
  console.log("req.query.isbn=%s\n",req.query.isbn);

  var strISBN = req.query.isbn;
  // ISBN must not be empty
  if (strISBN == null || strISBN == "")
  {
    console.log("ERROR: Web Service called with an empty isbn parameter");
    return objLocalWebServiceResult.sendStatus(400);
  }

  const urls= [
    "http://xisbn.worldcat.org/webservices/xid/isbn/"+encodeURIComponent(strISBN)+"?method=getMetadata&format=json&fl="+encodeURIComponent('*'),
    "https://www.googleapis.com/books/v1/volumes?q=isbn:"+encodeURIComponent(strISBN),
    "http://localhost:3000/item/aws?isbn="+encodeURIComponent(strISBN)
  ];
  async.map(urls, function (url, callback) {
    // DEBUG
    console.log("Calling Web Service "+url);
    const options = {
      url :  url,
      json : true
    };
    request(options,
      function(err, res, body) {
        // DEBUG
        console.log("Body = %j",body);
        var objSQLConnection = db.new_connection();
        db.runsql("\
    INSERT INTO log(`date_time`, `type`, `label`, `request`, `result`) \n\
    VALUES (\n\
      NOW(), 'WEBSERVICE', "+objSQLConnection.escape("ISBN Web Service")+", "+objSQLConnection.escape(url)+",COMPRESS("+objSQLConnection.escape(JSON.stringify(body))+") \n\
    )\n\
    ;\n\
    " /* strSQL */, null /* fnCallback */, objSQLConnection);
        callback(err, body);
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

    // DEBUG
    console.log("res=%j\n",res);

    if (res && res.length > 0)
    {
      // Response is ok : build a custom object for replying (with only the first item)
      for (var intResult in res)
      {
        // DEBUG
        console.log("res[intResult]=%j\n",res[intResult]);

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
              // One result only - Item is an object
              // DEBUG
              console.log("one result: objResults= %j", objResults);
              aws_post_processing(strISBN, objResults.ItemAttributes, objWebServiceResult);
            }
            else
            {
              // Multiples results - Item is an Array of objects
              // DEBUG
              console.log("multiple results: objResults= %j", objResults);
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

      // DEBUG
      console.log("objWebServiceResult=%j", objWebServiceResult);

      // Return final result
      objLocalWebServiceResult.json(objWebServiceResult);

    } // if (res && res.length > 0)
  });

});

// GET info from Amazon Web Service (fetch isbn information with Amazon ID/Password)
router.get('/aws', function(req, objLocalWebServiceResult, next) {

  console.log("webservice/aws");
  var objMyContext = new module_context(req, objLocalWebServiceResult, next);
  var objWebServiceResult = {status:"KO"};

  // Must be something in the body
  if (!req.body)
  {
    console.log("ERROR: Web Service called with an empty body");
    return objLocalWebServiceResult.sendStatus(400);
  }

  // DEBUG
  console.log("req.query.isbn=%s\n",req.query.isbn);

  var strISBN = req.query.isbn;
  // ISBN must not be empty
  if (strISBN == null || strISBN == "")
  {
    console.log("ERROR: Web Service called with an empty isbn parameter");
    return objLocalWebServiceResult.sendStatus(400);
  }

  var OperationHelper = require('apac').OperationHelper;

  var opHelper = new OperationHelper({
      awsId:     strAWSId,
      awsSecret: strAWSSecret,
      assocId:   strAWSAssocId,
      /* Enable automatic throttling option to workaround Amazon's limit of one request per second per IP */
      maxRequestsPerSecond: 1
  });

  opHelper.execute('ItemLookup', {
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
        console.log("Results: %j\n", results);
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

  console.log("/webservice/items:req.query=%j", req.query);
  var strSQLWhere1 = null;
  var strSQLWhere2 = null;
  if (req.query.text)
  {
    var strValue = req.query.text;
    var strSQLText = objSQLConnection.escape(strValue);
    var strSQLTextLike = objSQLConnection.escape(strValue+"%");
    strSQLWhere1 = " MATCH(item_classification.label) AGAINST ("+strSQLText+" IN BOOLEAN MODE)\n";
    strSQLWhere2 = " item_classification.label LIKE "+strSQLTextLike+"\n";
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
FROM item_classification\
"+(strSQLWhere2 == null ? "" : "\nWHERE "+strSQLWhere2)+"\
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
      console.log("/webservice/items/classification:rows=%j", rows);
      res.json(rows);
    }, objSQLConnection);
  } // if (req.body.action == "borrow")
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

module.exports = router;
