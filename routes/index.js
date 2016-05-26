var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var db = require('./db'); // database utilities
var debug = require('debug')('bibliopuce:routes_index');

/* ******************************************************************************** GET home page. */
router.get('/', function(req, res, next) {

  debug("req.query=%j", req.query);
  // Check requested language
  if (req && req.query && req.query.lang)
  {
    var strLang = req.query.lang;
    res.cookie('locale', strLang);
  }
  res.render('index', { title: req.app.locals.title, subtitle: "", menus:[] });
});

/* ******************************************************************************** SET language */
router.get('/set', function(req, res, next) {

  debug("req.query=%j", req.query);
  // Check requested language
  if (req && req.query && req.query.lang)
  {
    var strLang = req.query.lang;
    res.cookie('bibliopuce_locale', strLang);
  }
  // Back to home page
  res.redirect("/");
});

module.exports = router;
