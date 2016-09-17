/*
      Copyright 2016 Replay SDK (http://www.replay-sdk.com)

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

     http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

var express = require('express');
var router = express.Router();
var mysql      = require('mysql');
var db = require('./db'); // database utilities
var debug = require('debug')('bibliopuce:routes_manage');
var connect_ensure_login = require('connect-ensure-login');

function module_context(req, res, next)
{
  // *** PARAMETERS (MENU)
  this.objMenu = {text:req.i18n.__("Gérer"),link:"/manage/"};
  this.objMainMenu = {text:req.i18n.__("Menu principal"),link:"/"};
}


/* ******************************************************************************** GET menu */
function manage_menu(req, res, next)
{
  var objMyContext = new module_context(req, res, next);
  res.render('manage/index', { title: req.app.locals.title, subtitle: null, menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu) });
}

router.get('/', function(req, res, next) {
  // If authentication is enabled, set passport module to handle it
  if (req.app.locals.config.application.authentication == "true")
  {
    connect_ensure_login.ensureLoggedIn('../login'),
    function(req, res){
      return(manage_menu(req,res, next));
    }
  }
  else
  {
    return(manage_menu(req,res, next));
  }

});

/* ******************************************************************************** LANG menu */
router.get('/lang', function(req, res, next) {

  var objMyContext = new module_context(req, res, next);
  res.render('manage/lang', { title: req.app.locals.title, subtitle: null, menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu) });

});

module.exports = router;
