/*
      Copyright 2016-2018 Replay SDK (http://www.replay-sdk.com)

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

/* ******************************************************************************** ACTIVITY menu */
function activity_menu (req, res, next) {
  return {text:req.i18n.__("Activité"),link:"/manage/activity/"}
} 

router.get('/activity', function(req, res, next) {
  
    var objMyContext = new module_context(req, res, next);
    res.render('manage/activity', { title: req.app.locals.title, subtitle: null, menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu) });
  
});

/* ******************************************************************************** ACTIVITY borrow */
router.get('/activity/borrow', function(req, res, next) {
  
  var objMyContext = new module_context(req, res, next);

  var strSQL = 'SELECT id, date_time,type,label,request,CAST(result AS CHAR) AS result FROM log WHERE type = \'SQL\' AND label = \'borrow\'  AND date_time BETWEEN DATE_ADD(NOW(), INTERVAL - 60 DAY) AND NOW() ORDER BY id DESC LIMIT 1000'
  db.list_sql(req, res, next, strSQL, function (err, result, fields) {
    if (err) throw err
    // Display records with "list" template
    res.render('manage/activity/list', { title: req.app.locals.title, subtitle: req.i18n.__("Emprunts"), menus: [objMyContext.objMainMenu].concat(objMyContext.objMenu, activity_menu(req, res, next)), records: result });
  })
})

/* ******************************************************************************** ACTIVITY user */
router.get('/activity/user', function(req, res, next) {
  
  var objMyContext = new module_context(req, res, next);

  var strSQL = 'SELECT id, date_time,type,label,request,CAST(result AS CHAR) AS result FROM log WHERE type = \'SQL\' AND label = \'user\'  AND date_time BETWEEN DATE_ADD(NOW(), INTERVAL - 60 DAY) AND NOW() ORDER BY id DESC LIMIT 1000'
  db.list_sql(req, res, next, strSQL, function (err, result, fields) {
    if (err) throw err
    // Display records with "list" template
    res.render('manage/activity/list', { title: req.app.locals.title, subtitle: req.i18n.__("Lecteurs"), menus: [objMyContext.objMainMenu].concat(objMyContext.objMenu, activity_menu(req, res, next)), records: result });
  })
})

/* ******************************************************************************** ACTIVITY item */
router.get('/activity/item', function(req, res, next) {
  
  var objMyContext = new module_context(req, res, next);

  var strSQL = 'SELECT id, date_time,type,label,request,CAST(result AS CHAR) AS result FROM log WHERE type = \'SQL\' AND label IN (\'item\',\'item_detail\')  AND date_time BETWEEN DATE_ADD(NOW(), INTERVAL - 60 DAY) AND NOW() ORDER BY id DESC LIMIT 1000'
  db.list_sql(req, res, next, strSQL, function (err, result, fields) {
    if (err) throw err
    // Display records with "list" template
    res.render('manage/activity/list', { title: req.app.locals.title, subtitle: req.i18n.__("Livres"), menus: [objMyContext.objMainMenu].concat(objMyContext.objMenu, activity_menu(req, res, next)), records: result });
  })
})

/* ******************************************************************************** ACTIVITY view */
function activity_context(req, res, next)
{
  // *** PARAMETERS (SQL)
  this.objFormParameters = {
    table_name: "log",
    /* Use a VIEW to list borrows with full information */
    list_table_name: "log",
    view_table_name: "log",
    primary_key: ["id"],
    autoincrement_column: "id",
    fields:[
      {name:"id",label:"#",type:"Integer",required:false,validation:null},
      {name:"date_time",label:req.i18n.__("Date/Heure"),type:"DateTime",required:true, read_only:true},
      {name:"type",label:req.i18n.__("Type"),type:"String",required:true,validation:null, read_only:true},
      {name:"label",label:req.i18n.__("Libellé"),type:"String",required:true,validation:null, read_only:true},
      {name:"request",label:req.i18n.__("Requête"),type:"String",required:true,validation:null, read_only:true},
      {name:"result",label:req.i18n.__("Auteur"),type:"String",required:false,validation:null, read_only:true},
    ],
    allowed_states:{_ADD:false,_MODIFY:false,_DELETE:false,_VIEW:true},
    sql_counter:null
  };
  // *** PARAMETERS (MENU)
  this.objMenu = [{text:req.i18n.__("Gérer"),link:"/manage/"},{text:req.i18n.__("Activité"),link:"/manage/activity/"}];
  this.objMainMenu = {text:req.i18n.__("Menu principal"),link:"/"};
}

router.get('/activity/view', function(req, res, next) {
  
  var objMyContext = new activity_context(req, res, next);
  db.view_record(req, res, next, objMyContext.objFormParameters, function(err, result, fields) {
    if (err) throw err;
    // Display first record with "view" template
    res.render('manage/activity/view', {
      title: req.app.locals.title,
      subtitle: req.i18n.__("Fiche"),
      menus:[objMyContext.objMainMenu].concat(objMyContext.objMenu),
      form:objMyContext.objFormParameters,
      record:result[0],
      message:null,
      form_id:result[0].id,
      form_info:null,
      form_custom_html:null });
  })

})

module.exports = router