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
// *** PARAMETERS (MENU)
var objMenu = {text:"Lecteurs",link:"/user/"};

// GET users menu
router.get('/', function(req, res, next) {
  res.render('user/index', { title: req.app.locals.title, subtitle: "Lecteur", menus:[req.app.locals.main_menu] });
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

  res.render('user/new', {title: req.app.locals.title, subtitle: "Lecteur", menus:[req.app.locals.main_menu,objMenu], form:objFormParameters, message:{text:"Veuillez remplir le formulaire",type:"info"}});

});
// POST new user (form validation then insert new record in database)
router.post('/new', function(req, res, next) {
  if (req.body["CANCEL"] != null)
  {
    // Cancel insert : Redirect to menu
    res.redirect('./');
  } // if (req.body["CANCEL"] != null)
  else if (req.body["OK"] != null)
  {
    db.insert_record(req, res, next, objFormParameters, function(err, result, fields) {
      if (err) throw err;

      // Redirect to list of users
      res.redirect('list'); // TODO res.redirect('view') compute parameters
    });
  } // else if (req.body["OK"] != null)
  else
  {
    // Neither OK nor CANCEL: error!
    throw new Error("ERROR: Invalid form state (must be OK or CANCEL)");
  }
});
// GET user (view)
router.get('/view', function(req, res, next) {

  db.view_record(req, res, next, objFormParameters, function(err, result, fields) {
    if (err) throw err;
    // Display first record with "view" template
    res.render('user/view', { title: req.app.locals.title, subtitle: "Fiche", menus:[req.app.locals.main_menu,objMenu], form:objFormParameters, record:result[0] });
  });

});

// TODO search, delete

module.exports = router;
