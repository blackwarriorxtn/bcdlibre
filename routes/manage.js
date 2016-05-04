var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var db = require('./db'); // database utilities

// *** PARAMETERS (MENU)
var objMenu = {text:"Gérer",link:"/manage/"};

/* ******************************************************************************** GET menu */
router.get('/', function(req, res, next) {
  res.render('manage/index', { title: req.app.locals.title, subtitle: objMenu.text, menus:[req.app.locals.main_menu] });
});

module.exports = router;
