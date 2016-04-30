var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var db = require('./db'); // database utilities

// ******************************************************************************** user

// *** PARAMETERS (SQL)
var objFormParameters = {
  table_name: "user",
  primary_key: ["id"],
  autoincrement_column: "id",
  fields:[
    {name:"id",label:"#",type:"String",required:false,validation:null},
    {name:"name",label:"Nom",type:"String",required:true,validation:null},
    {name:"login",label:"Compte",type:"String",required:true,validation:null},
    {name:"phone",label:"Téléphone",type:"String",required:false,validation:null},
    {name:"comment",label:"Commentaire",type:"String",required:false,validation:null},
  ]
};
// To search we only have ONE field named "search" and a special SQL table with full text indexes
var objSearchParameters = {
  table_name: objFormParameters.table_name+"_search",
  primary_key: objFormParameters.primary_key,
  autoincrement_column: objFormParameters.autoincrement_column,
  fields:[
    {
      name:"search",label:"Nom, Compte, Commentaires",type:"String",required:true,validation:null,maximum_length:255,
      match_fields:[
        "name",
        "login",
        "comment"
      ]
    },
  ]
};
// *** PARAMETERS (MENU)
var objMenu = {text:"Lecteurs",link:"/user/"};

// GET users menu
router.get('/', function(req, res, next) {
  res.render('user/index', { title: req.app.locals.title, subtitle: objMenu.text, menus:[req.app.locals.main_menu] });
});
// GET list of users
router.get('/list', function(req, res, next) {

  // Check parameter l for limit
  var intLimit = 100; // Default: last 100 users
  if (req.query.l)
  {
    intLimit = parseInt(req.query.l,10);
  }
  // Display last n users
  var objSQLOptions = {order_by:[{name:"id", direction:"DESC"}], limit:intLimit};
  db.list_record(req, res, next, objFormParameters, objSQLOptions, function(err, result, fields) {
    if (err) throw err;
    // Display records with "list" template
    res.render('user/list', {title: req.app.locals.title, subtitle: "Liste", menus:[req.app.locals.main_menu,objMenu], form:objFormParameters, records:result});
  });

});
// GET new user (form)
router.get('/new', function(req, res, next) {

  res.render('user/new', {title: req.app.locals.title, subtitle: objMenu.text, menus:[req.app.locals.main_menu,objMenu], form:objFormParameters, message:{text:"Veuillez remplir le formulaire",type:"info"}, action:"new"});

});

// POST new user (form validation then insert new record in database)
router.post('/new', function(req, res, next) {
  if (req.body["_CANCEL"] != null)
  {
    // Cancel insert : Redirect to menu
    res.redirect('./');
  } // if (req.body["_CANCEL"] != null)
  else if (req.body["_OK"] != null)
  {
    db.insert_record(req, res, next, objFormParameters, function(err, result, fields) {
      if (err) throw err;

      // Redirect to list of users
      res.redirect('list'); // TODO res.redirect('view') compute parameters
    });
  } // else if (req.body["_OK"] != null)
  else
  {
    // Neither OK nor CANCEL: error!
    throw new Error("ERROR: Invalid form state (must be OK or CANCEL)");
  }
});

// POST update (form validation then update all fields in database)
router.post('/update', function(req, res, next) {
  if (req.body["_CANCEL"] != null)
  {
    // Cancel : Redirect to menu
    res.redirect('./');
  } // if (req.body["_CANCEL"] != null)
  else if (req.body["_OK"] != null)
  {
    db.update_record(req, res, next, objFormParameters, function(err, result, fields, objSQLConnection) {
      if (err)
      {
        db.handle_error(err, res, "user/update", { title: req.app.locals.title, subtitle: objMenu.text, menus:[req.app.locals.main_menu,objMenu], form:objFormParameters, message:"Impossible de modifier ce lecteur ("+err+")" });
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

// POST delete (form validation then delete record in database)
router.post('/delete', function(req, res, next) {
  if (req.body["_CANCEL"] != null)
  {
    // Cancel : Redirect to menu
    res.redirect('./');
  } // if (req.body["_CANCEL"] != null)
  else if (req.body["_OK"] != null)
  {
    db.delete_record(req, res, next, objFormParameters, function(err, result, fields, objSQLConnection) {
      if (err)
      {
        db.handle_error(err, res, "user/delete", { title: req.app.locals.title, subtitle: objMenu.text, menus:[req.app.locals.main_menu,objMenu], form:objFormParameters, message:"Impossible d'effacer ce lecteur ("+err+")" });
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

// GET user (view)
router.get('/view', function(req, res, next) {

  db.view_record(req, res, next, objFormParameters, function(err, result, fields) {
    if (err) throw err;
    // Display first record with "view" template
    res.render('user/view', { title: req.app.locals.title, subtitle: "Fiche", menus:[req.app.locals.main_menu,objMenu], form:objFormParameters, record:result[0], message:null });
  });

});





// ************************************************************************************* SEARCH
// GET search (form)
router.get('/search', function(req, res, next) {

  res.render('user/new', {req:req, title: req.app.locals.title, subtitle: objMenu.text, menus:[req.app.locals.main_menu,objMenu], form:objSearchParameters, message:{text:"Veuillez remplir le formulaire",type:"info"}, action:"search"});

});
// POST search (form validation then search records in database)
router.post('/search', function(req, res, next) {
  if (req.body["_CANCEL"] != null)
  {
    // Cancel insert : Redirect to menu
    res.redirect('./');
  } // if (req.body["_CANCEL"] != null)
  else if (req.body["_OK"] != null)
  {
    db.search_record(req, res, next, objSearchParameters, null /* objSQLOptions */, function(err, result, fields) {
      if (err) throw err;
      // Display records with "list" template
      res.render('user/list', { title: req.app.locals.title, subtitle: "Liste", menus:[req.app.locals.main_menu,objMenu], form:objFormParameters, records:result });
    });
  } // else if (req.body["_CANCEL"] != null)
  else
  {
    // Neither _OK nor _CANCEL: error!
    throw new Error("ERROR: Invalid form state (must be _OK or _CANCEL)");
  }

});

module.exports = router;
