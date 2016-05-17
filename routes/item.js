var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var db = require('./db'); // database utilities
var request = require('request');
var async = require('async');

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
      {name:"isbn13",label:req.i18n.__("Numéro ISBN"),type:"String",required:false,validation:null,maximum_length:13},
      {name:"title",label:req.i18n.__("Titre"),type:"String",required:true,validation:null,maximum_length:255},
      {name:"author",label:req.i18n.__("Auteur"),type:"String",required:true,validation:null,maximum_length:255},
      {name:"description",label:req.i18n.__("Description (Synopsis)"),type:"String",required:false,validation:null,maximum_length:65535},
    ]
  };
  // To search we only have ONE field named "search" and a special SQL table with full text indexes
  this.objSearchParameters = {
    table_name: this.objFormParameters.table_name+"_search",
    primary_key: this.objFormParameters.primary_key,
    autoincrement_column: this.objFormParameters.autoincrement_column,
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
  res.render('item/new', {req:req, title: req.app.locals.title, subtitle: null, menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objFormParameters, message:{text:"Veuillez remplir le formulaire",type:"info"}, action:"new"});

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
        db.handle_error(err, res, "item/new", { title: req.app.locals.title, subtitle: null, menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objFormParameters, message:{text:"Ce livre est déjà dans l'inventaire ("+err+")",type:"error"}, action:"new" });
      }
      else
      {
        // Always add at least ONE exemplary of the book (item => item_detail)
        db.runsql("INSERT INTO item(item_detail_id) VALUES(LAST_INSERT_ID());" /* strSQL */, function(err, rows, fields) {
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
        db.handle_error(err, res, "item/update", { title: req.app.locals.title, subtitle: null, menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objFormParameters, message:"Impossible de modifier ce livre ("+err+")" });
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
        db.handle_error(err, res, "item/delete", { title: req.app.locals.title, subtitle: null, menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objFormParameters, message:"Impossible d'effacer ce livre ("+err+")" });
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
    "https://www.googleapis.com/books/v1/volumes?q=isbn:"+encodeURIComponent(strISBN)
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




// ************************************************************************************* SEARCH
// GET search (form)
router.get('/search', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  res.render('item/new', {req:req, title: req.app.locals.title, subtitle: req.i18n.__("Recherche"), menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objSearchParameters, message:{text:"Veuillez remplir le formulaire",type:"info"}, action:"search"});

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


module.exports = router;
