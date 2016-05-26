var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var db = require('./db'); // database utilities
var debug = require('debug')('bibliopuce:routes_manage');

function module_context(req, res, next)
{
  // *** PARAMETERS (MENU)
  this.objMenu = {text:req.i18n.__("Gérer"),link:"/manage/"};
  this.objMainMenu = {text:req.i18n.__("Menu principal"),link:"/"};
}

/* ******************************************************************************** GET menu */
router.get('/', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  res.render('manage/index', { title: req.app.locals.title, subtitle: null, menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu) });

});

module.exports = router;
