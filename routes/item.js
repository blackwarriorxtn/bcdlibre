var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var db = require('./db'); // database utilities
var request = require('request');
var async = require('async');

// ******************************************************************************** item

// *** PARAMETERS (SQL)
var objFormParameters = {
  table_name: "item_detail",
  primary_key: ["id"],
  autoincrement_column: "id",
  fields:[
    {name:"id",label:"#",type:"String",required:false,validation:null},
    {name:"isbn13",label:"Numéro ISBN",type:"String",required:false,validation:null,maximum_length:13},
    {name:"title",label:"Titre",type:"String",required:true,validation:null,maximum_length:255},
    {name:"author",label:"Auteur",type:"String",required:true,validation:null,maximum_length:255},
    {name:"description",label:"Description (Synopsis)",type:"String",required:false,validation:null,maximum_length:65535},
  ]
};
// *** PARAMETERS (MENU)
var objMenu = {text:"Livres",link:"/item/"};

// GET menu
router.get('/', function(req, res, next) {
  res.render('item/index', { title: req.app.locals.title, subtitle: "Livres", menus:[req.app.locals.main_menu] });
});
// Get list
router.get('/list', function(req, res, next) {

  db.list_record(req, res, next, objFormParameters, null /* objSQLOptions */, function(err, result, fields) {
    if (err) throw err;
    // Display records with "list" template
    res.render('item/list', { title: req.app.locals.title, subtitle: "Liste", menus:[req.app.locals.main_menu,objMenu], form:objFormParameters, records:result });
  });

});
// GET new (form)
router.get('/new', function(req, res, next) {

  res.render('item/new', { title: req.app.locals.title, subtitle: "Livre", menus:[req.app.locals.main_menu,objMenu], form:objFormParameters });

});
// POST new (form validation then insert new record in database)
router.post('/new', function(req, res, next) {
  db.insert_record(req, res, next, objFormParameters, function(err, result, fields) {
    if (err) throw err;

    // Redirect to list of users
    res.redirect('list'); // TODO res.redirect('view') compute parameters
  });
});
// GET view
router.get('/view', function(req, res, next) {

  db.view_record(req, res, next, objFormParameters, function(err, result, fields) {
    if (err) throw err;
    // Display first record with "view" template
    res.render('user/view', { title: req.app.locals.title, subtitle: "Fiche", menus:[req.app.locals.main_menu,objMenu], form:objFormParameters, record:result[0] });
  });

});

// GET web service (fetch isbn information)
router.get('/webservice', function(req, objLocalWebServiceResult, next) {

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

// TODO new, search, delete

module.exports = router;
