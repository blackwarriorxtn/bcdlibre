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

// GET users menu
router.get('/', function(req, res, next) {
  res.render('user/index', { title: req.app.locals.title, subtitle: "Lecteur", menus:[{text:"Menu principal",link:"/"}] });
});
// GET list of users
router.get('/list', function(req, res, next) {

  db.runsql('SELECT * FROM user', function(err, rows, fields) {
    if (err) throw err;
    res.render('user/list', { title: req.app.locals.title, subtitle: "Liste", menus:[{text:"Menu principal",link:"/"},{text:"Lecteurs",link:"/user/"}], users:rows });
  });

});
// GET new user (form)
router.get('/new', function(req, res, next) {

  res.render('user/new', { title: req.app.locals.title, subtitle: "Lecteur", menus:[{text:"Menu principal",link:"/"},{text:"Lecteurs",link:"/user/"}], form:objFormParameters });

});
// POST new user (form validation then insert new record in database)
router.post('/new', function(req, res, next) {
  db.insert_record(req,res,next,objFormParameters);
});
// GET user (view)
router.get('/view', function(req, res, next) {

  db.view_record(req, res, next, objFormParameters, function(err, rows, fields) {
    if (err) throw err;
    // Display first record with "view" template
    res.render('user/view', { title: req.app.locals.title, subtitle: "Fiche", menus:[{text:"Menu principal",link:"/"},{text:"Lecteurs",link:"/user/"}], form:objFormParameters, record:rows[0] });
  });

});

// TODO view, search, delete

module.exports = router;
