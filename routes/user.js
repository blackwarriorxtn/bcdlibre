var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var db = require('./db'); // database utilities

// ******************************************************************************** user
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

  var arrFields = [
    {name:"name",label:"Nom",type:"String",required:true,validation:null},
    {name:"login",label:"Compte",type:"String",required:true,validation:null},
    {name:"phone",label:"Téléphone",type:"String",required:false,validation:null},
    {name:"comment",label:"Commentaire",type:"String",required:false,validation:null},
  ];
  res.render('user/new', { title: req.app.locals.title, subtitle: "Lecteur", menus:[{text:"Menu principal",link:"/"},{text:"Lecteurs",link:"/user/"}], fields:arrFields });

});
// POST new user (form validation)
router.post('/user/new', function(req, res, next) {

  var arrFields = [
    {name:"name",label:"Nom",type:"String",required:true,validation:null},
    {name:"login",label:"Compte",type:"String",required:true,validation:null},
    {name:"phone",label:"Téléphone",type:"String",required:false,validation:null},
    {name:"comment",label:"Commentaire",type:"String",required:false,validation:null},
  ];
  res.render('user/new', { title: req.app.locals.title, subtitle: "Lecteur", menus:[{text:"Menu principal",link:"/"},{text:"Lecteurs",link:"/user/"}], fields:arrFields });

});

// TODO search, delete

module.exports = router;
