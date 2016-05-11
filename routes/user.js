var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var db = require('./db'); // database utilities

// ******************************************************************************** user
function module_context(req, res, next)
{
  // *** PARAMETERS (SQL)
  this.objFormParameters = {
    table_name: "user",
    primary_key: ["id"],
    autoincrement_column: "id",
    fields:[
      {name:"id",label:"#",type:"String",required:false,validation:null},
      {name:"name",label:req.i18n.__("Nom"),type:"String",required:true,validation:null},
      {name:"login",label:req.i18n.__("Compte"),type:"String",required:true,validation:null},
      {name:"phone",label:req.i18n.__("Téléphone"),type:"String",required:false,validation:null},
      {name:"comment",label:req.i18n.__("Commentaire"),type:"String",required:false,validation:null},
    ]
  };
  // To search we only have ONE field named "search" and a special SQL table with full text indexes
  this.objSearchParameters = {
    table_name: this.objFormParameters.table_name+"_search",
    primary_key: this.objFormParameters.primary_key,
    autoincrement_column: this.objFormParameters.autoincrement_column,
    fields:[
      {
        name:"search",label:req.i18n.__("Nom, Compte, Commentaires"),type:"String",required:true,validation:null,maximum_length:255,
        match_fields:[
          "name",
          "login",
          "comment"
        ]
      },
    ]
  };
  // *** PARAMETERS (MENU)
  this.objMenu = [{text:req.i18n.__("Gérer"),link:"/manage/"},{text:req.i18n.__("Lecteurs"),link:"/user/"}];
  this.objMainMenu = {text:req.i18n.__("Menu principal"),link:"/"};
}

// GET users menu
router.get('/', function(req, res, next) {
  var objMyContext = new module_context(req, res, next);
  res.render('user/index', { title: req.app.locals.title, subtitle: null, menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu) });
});
// GET list of users
router.get('/list', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  // Check parameter l for limit
  var intLimit = 100; // Default: last 100 users
  if (req.query.l)
  {
    intLimit = parseInt(req.query.l,10);
  }
  // Display last n users
  var objSQLOptions = {order_by:[{name:"id", direction:"DESC"}], limit:intLimit};
  db.list_record(req, res, next, objMyContext.objFormParameters, objSQLOptions, function(err, result, fields) {
    if (err) throw err;
    // Display records with "list" template
    res.render('user/list', {title: req.app.locals.title, subtitle: req.i18n.__("Liste"), menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objFormParameters, records:result});
  });

});
// GET new user (form)
router.get('/new', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  res.render('user/new', {title: req.app.locals.title, subtitle: null, menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objFormParameters, message:{text:req.i18n.__("Veuillez remplir le formulaire"),type:"info"}, action:"new"});

});

// POST new user (form validation then insert new record in database)
router.post('/new', function(req, res, next) {
  var objMyContext = new module_context(req, res, next);
  if (req.body["_CANCEL"] != null)
  {
    // Cancel insert : Redirect to menu
    res.redirect('./');
  } // if (req.body["_CANCEL"] != null)
  else if (req.body["_OK"] != null)
  {
    db.insert_record(req, res, next, objMyContext.objFormParameters, function(err, result, fields) {
      if (err) throw err;

      // Redirect to list of users
      res.redirect('list'); // TODO res.redirect('view') compute parameters
    });
  } // else if (req.body["_OK"] != null)
  else
  {
    // Neither OK nor CANCEL: error!
    throw new Error(req.i18n.__("ERROR: Invalid form state (must be OK or CANCEL)"));
  }
});

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
        db.handle_error(err, res, "user/update", { title: req.app.locals.title, subtitle: null, menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objFormParameters, message:req.i18n.__("Impossible de modifier ce lecteur (%s)",err) });
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
    throw new Error(req.i18n.__("ERROR: Invalid form state (must be _OK or _CANCEL)"));
  }

});

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
        db.handle_error(err, res, "user/delete", { title: req.app.locals.title, subtitle: null, menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objFormParameters, message:req.i18n.__("Impossible d'effacer ce lecteur (%s)",err) });
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
    throw new Error(req.i18n.__("ERROR: Invalid form state (must be _OK or _CANCEL)"));
  }

});

// GET user (view)
router.get('/view', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  db.view_record(req, res, next, objMyContext.objFormParameters, function(err, result, fields) {
    if (err) throw err;
    // Display first record with "view" template
    res.render('user/view', { title: req.app.locals.title, subtitle: req.i18n.__("Fiche"), menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objFormParameters, record:result[0], message:null });
  });

});





// ************************************************************************************* SEARCH
// GET search (form)
router.get('/search', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  res.render('user/new', {req:req, title: req.app.locals.title, subtitle: req.i18n.__("Recherche"), menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objSearchParameters, message:{text:req.i18n.__("Veuillez remplir le formulaire"),type:"info"}, action:"search"});

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
      res.render('user/list', { title: req.app.locals.title, subtitle: req.i18n.__("Liste"), menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu), form:objMyContext.objFormParameters, records:result });
    });
  } // else if (req.body["_CANCEL"] != null)
  else
  {
    // Neither _OK nor _CANCEL: error!
    throw new Error(req.i18n.__("ERROR: Invalid form state (must be _OK or _CANCEL)"));
  }

});

module.exports = router;
