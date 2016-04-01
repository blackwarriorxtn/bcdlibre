var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var db = require('./db'); // database utilities

// ******************************************************************************** item

// *** PARAMETERS (SQL)
var objFormParameters = {
  table_name: "item_detail",
  primary_key: ["id"],
  autoincrement_column: "id",
  fields:[
    {name:"id",label:"#",type:"String",required:false,validation:null},
    {name:"isbn13",label:"Numéro ISBN",type:"String",required:false,validation:null},
    {name:"title",label:"Titre",type:"String",required:true,validation:null},
    {name:"author",label:"Auteur",type:"String",required:true,validation:null},
    {name:"description",label:"Description (Synopsis)",type:"String",required:false,validation:null},
  ]
};
// *** PARAMETERS (MENU)
var objMenu = {text:"Inventaire",link:"/item/"};

// GET menu
router.get('/', function(req, res, next) {
  res.render('item/index', { title: req.app.locals.title, subtitle: "Inventaire", menus:[req.app.locals.main_menu] });
});
// Get list
router.get('/list', function(req, res, next) {

  db.list_record(req, res, next, objFormParameters, null /* objSQLOptions */, function(err, result, fields) {
    if (err) throw err;
    // Display records with "list" template
    res.render('item/list', { title: req.app.locals.title, subtitle: "Liste", menus:[req.app.locals.main_menu,objMenu], form:objFormParameters, records:result });
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

// TODO new, search, delete

module.exports = router;
