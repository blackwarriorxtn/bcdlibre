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

var express = require('express')
var router = express.Router()
var db = require('./db') // database utilities

// ******************************************************************************** user
function ModuleContext (req, res, next) {
  // *** PARAMETERS (SQL)
  this.objFormParameters = {
    table_name: 'user',
    primary_key: ['id'],
    autoincrement_column: 'id',
    fields: [
      {name: 'id', label: '#', type: 'Integer', required: false, validation: null},
      {name: 'last_name', label: req.i18n.__('Nom'), type: 'String', required: true, validation: null},
      {name: 'first_name', label: req.i18n.__('Prénom'), type: 'String', required: false, validation: null},
      {name: 'category', label: req.i18n.__('Catégorie'), type: 'String', required: false, validation: null},
      {name: 'phone', label: req.i18n.__('Téléphone'), type: 'String', required: false, validation: null},
      {name: 'comment', label: req.i18n.__('Commentaire'), type: 'String', required: false, validation: null}
    ],
    allowed_states: null,
    sql_counter: null
  }
  // To search we only have ONE field named "search" and a special SQL table with full text indexes
  this.objSearchParameters = {
    table_name: this.objFormParameters.table_name + '_search',
    primary_key: this.objFormParameters.primary_key,
    autoincrement_column: this.objFormParameters.autoincrement_column,
    list_fields: 'user_id AS id, last_name, first_name, category, comment',
    fields: [
      {
        name: 'search',
        label: req.i18n.__('Nom, Compte, Commentaires'),
        type: 'String',
        required: true,
        validation: null,
        maximum_length: 255,
        match_fields: [
          'last_name',
          'first_name',
          'category',
          'comment'
        ]
      }
    ]
  }
  // *** PARAMETERS (MENU)
  this.objMenu = [{text: req.i18n.__('Gérer'), link: '/manage/'}, {text: req.i18n.__('Lecteurs'), link: '/user/'}]
  this.objMainMenu = {text: req.i18n.__('Menu principal'), link: '/'}
}

// GET users menu
router.get('/', function (req, res, next) {
  var objMyContext = new ModuleContext(req, res, next)
  res.render('user/index', { title: req.app.locals.title, subtitle: null, menus: [objMyContext.objMainMenu].concat(objMyContext.objMenu) })
})
// GET list of users
router.get('/list', function (req, res, next) {
  var objMyContext = new ModuleContext(req, res, next)
  // Check parameter l for limit
  var intLimit = 500 // Default: last 500 users
  if (req.query.l) {
    intLimit = parseInt(req.query.l, 10)
  }
  // Display last n users
  var objSQLOptions = {order_by: [{name: 'id', direction: 'DESC'}], limit: intLimit}
  db.list_record(req, res, next, objMyContext.objFormParameters, objSQLOptions, function (err, result, fields) {
    if (err) throw err
    // Display records with "list" template
    res.render('user/list', {title: req.app.locals.title, subtitle: req.i18n.__('Liste'), menus: [objMyContext.objMainMenu].concat(objMyContext.objMenu), form: objMyContext.objFormParameters, records: result, sql: objSQLOptions})
  })
})

// GET new user (form)
router.get('/new', function (req, res, next) {
  var objMyContext = new ModuleContext(req, res, next)
  res.render('user/new', {req: req, title: req.app.locals.title, subtitle: null, menus: [objMyContext.objMainMenu].concat(objMyContext.objMenu), form: objMyContext.objFormParameters, message: {text: req.i18n.__('Veuillez remplir le formulaire'), type: 'info'}, action: 'new'})
})

// POST new user (form validation then insert new record in database)
router.post('/new', function (req, res, next) {
  var objMyContext = new ModuleContext(req, res, next)
  if (req.body['_CANCEL'] != null) {
    // Cancel insert : Redirect to menu
    res.redirect('./')
  } else if (req.body['_OK'] != null) {
    db.insert_record(req, res, next, objMyContext.objFormParameters, function (err, result, fields) {
      if (err) throw err

      // Redirect to menu
      res.redirect('./')
    })
  } else {
    // Neither OK nor CANCEL: error!
    throw new Error(req.i18n.__('ERROR: Invalid form state (must be OK or CANCEL)'))
  }
})

// POST update (form validation then update all fields in database)
router.post('/update', function (req, res, next) {
  var objMyContext = new ModuleContext(req, res, next)
  if (req.body['_CANCEL'] != null) {
    // Cancel : Redirect to menu
    res.redirect('./')
  } else if (req.body['_OK'] != null) {
    db.update_record(req, res, next, objMyContext.objFormParameters, function (err, result, fields, objSQLConnection) {
      if (objSQLConnection) {
        objSQLConnection.end()
      }
      if (err) {
        var strMessageText = req.i18n.__('Impossible de modifier ce lecteur (%s)', err)
        console.log(strMessageText)
        db.handle_error(err, res, req, 'user/update', { title: req.app.locals.title, subtitle: null, menus: [objMyContext.objMainMenu].concat(objMyContext.objMenu), form: objMyContext.objFormParameters, message: strMessageText })
      } else {
        // Redirect to menu
        res.redirect('./')
      }
    })
  } else {
    // Neither _OK nor _CANCEL: error!
    throw new Error(req.i18n.__('ERROR: Invalid form state (must be _OK or _CANCEL)'))
  }
})

// POST delete (form validation then delete record in database)
router.post('/delete', function (req, res, next) {
  var objMyContext = new ModuleContext(req, res, next)
  if (req.body['_CANCEL'] != null) {
    // Cancel : Redirect to menu
    res.redirect('./')
  } else if (req.body['_OK'] != null) {
    db.delete_record(req, res, next, objMyContext.objFormParameters, function (err, result, fields, objSQLConnection) {
      if (objSQLConnection) {
        objSQLConnection.end()
      }
      if (err) {
        db.handle_error(err, res, req, 'user/delete', { title: req.app.locals.title, subtitle: null, menus: [objMyContext.objMainMenu].concat(objMyContext.objMenu), form: objMyContext.objFormParameters, message: req.i18n.__("Impossible d'effacer ce lecteur (%s)", err) })
      } else {
        // Redirect to menu
        res.redirect('./')
      }
    })
  } else {
    // Neither _OK nor _CANCEL: error!
    throw new Error(req.i18n.__('ERROR: Invalid form state (must be _OK or _CANCEL)'))
  }
})

// GET user (view)
router.get('/view', function (req, res, next) {
  var objMyContext = new ModuleContext(req, res, next)
  db.view_record(req, res, next, objMyContext.objFormParameters, function (err, result, fields) {
    if (err) throw err
    // Display first record with "view" template
    res.render('user/view', {
      title: req.app.locals.title,
      subtitle: req.i18n.__('Fiche'),
      menus: [objMyContext.objMainMenu].concat(objMyContext.objMenu),
      form: objMyContext.objFormParameters,
      record: result[0],
      message: null,
      form_id: result[0].id,
      form_info: null,
      form_custom_html: null })
  })
})

// ************************************************************************************* SEARCH
// GET search (form)
router.get('/search', function (req, res, next) {
  var objMyContext = new ModuleContext(req, res, next)
  res.render('user/new', {req: req, title: req.app.locals.title, subtitle: req.i18n.__('Recherche'), menus: [objMyContext.objMainMenu].concat(objMyContext.objMenu), form: objMyContext.objSearchParameters, message: {text: req.i18n.__('Veuillez remplir le formulaire'), type: 'info'}, action: 'search'})
})

// POST search (form validation then search records in database)
router.post('/search', function (req, res, next) {
  var objMyContext = new ModuleContext(req, res, next)
  if (req.body['_CANCEL'] != null) {
    // Cancel insert : Redirect to menu
    res.redirect('./')
  } else if (req.body['_OK'] != null) {
    // Check parameter l for limit
    var intLimit = 500 // Default: last 500 users
    if (req.query.l) {
      intLimit = parseInt(req.query.l, 10)
    }
    // Display last n users
    var objSQLOptions = {order_by: [{name: 'id', direction: 'DESC'}], limit: intLimit}
    db.search_record(req, res, next, objMyContext.objSearchParameters, objSQLOptions, function (err, result, fields) {
      if (err) throw err
      // Display records with "list" template
      res.render('user/list', { title: req.app.locals.title, subtitle: req.i18n.__('Liste'), menus: [objMyContext.objMainMenu].concat(objMyContext.objMenu), form: objMyContext.objFormParameters, records: result, sql: objSQLOptions })
    })
  } else {
    // Neither _OK nor _CANCEL: error!
    throw new Error(req.i18n.__('ERROR: Invalid form state (must be _OK or _CANCEL)'))
  }
})

// ************************************************************************************* DEDUPLICATE
function deduplicateSQL () {
  var arrSQL = ['DROP TEMPORARY TABLE IF EXISTS tmp_deduplicate_user\n;',
    'CREATE TEMPORARY TABLE tmp_deduplicate_user(\n' +
                  '  id INTEGER PRIMARY KEY\n' +
                  ')\n;',
    'INSERT INTO tmp_deduplicate_user(id) \n' +
                  'SELECT u2.id \n' +
                  'FROM user u1 \n' +
                  'LEFT OUTER JOIN user u2 ON u2.last_name = u1.last_name AND u2.first_name = u1.first_name AND u2.category = u1.category AND u2.id > u1.id\n' +
                  'WHERE u2.id IS NOT NULL\n' +
                  ';\n'
  ]
  return (arrSQL)
}
// GET deduplicate (form with pre-computation)
router.get('/deduplicate', function (req, res, next) {
  var objMyContext = new ModuleContext(req, res, next)
  // Check parameter l for limit
  var intLimit = 500 // Default: last 500 users
  if (req.query.l) {
    intLimit = parseInt(req.query.l, 10)
  }
  var objSQLOptions = {order_by: [{name: 'id', direction: 'DESC'}], limit: intLimit}
  var arrSQL = deduplicateSQL().concat('/* Display Users to be deleted */\n' +
'SELECT user.* FROM tmp_deduplicate_user\n' +
'JOIN user ON user.id = tmp_deduplicate_user.id\n' +
'ORDER BY tmp_deduplicate_user.id\n' +
';\n')
  db.runsql(arrSQL, function (err, arrRows, fields, objSQLConnection) {
    if (err) throw err
    // Display records with "list" template
    var result = db.rows(arrRows)
    res.render('user/deduplicate', {
      req: req,
      title: req.app.locals.title,
      subtitle: req.i18n.__('Liste des doublons'),
      message: {text: req.i18n.__('Voulez-vous supprimer tous ces doublons?'), type: 'warning'},
      menus: [objMyContext.objMainMenu].concat(objMyContext.objMenu),
      form: objMyContext.objFormParameters,
      record: null,
      records: result,
      sql: objSQLOptions,
      action: 'deduplicate' })
  })
})
// POST deduplicate (form validation then remove duplicate records in database)
router.post('/deduplicate', function (req, res, next) {
  var objMyContext = new ModuleContext(req, res, next)
  if (req.body['_CANCEL'] != null) {
    // Cancel insert : Redirect to menu
    res.redirect('./')
  } else if (req.body['_OK'] != null) {
    // Check parameter l for limit
    var intLimit = 500 // Default: last 500 users
    if (req.query.l) {
      intLimit = parseInt(req.query.l, 10)
    }
    // Display last n users
    var objSQLOptions = {order_by: [{name: 'id', direction: 'DESC'}], limit: intLimit}
    var arrSQL = deduplicateSQL().concat('/* Delete duplicate users - ignore ERRORS caused by constraints (can\'t delete user who has borrowed a book) */\n' +
'DELETE IGNORE FROM user\n' +
'USING user, tmp_deduplicate_user\n' +
'WHERE user.id = tmp_deduplicate_user.id\n' +
';\n',
'/* Display remaining duplicates */\n' +
'SELECT u2.*\n' +
'FROM user u1 \n' +
'LEFT OUTER JOIN user u2 ON u2.last_name = u1.last_name AND u2.first_name = u1.first_name AND u2.category = u1.category AND u2.id > u1.id\n' +
'WHERE u2.id IS NOT NULL\n' +
';\n'

    )
    db.runsql(arrSQL, function (err, arrRows, fields, objSQLConnection) {
      if (err) throw err
      // Display records with "list" template
      var result = db.rows(arrRows)
      res.render('user/list', { title: req.app.locals.title, subtitle: req.i18n.__('Liste des doublons avec emprunt'), menus: [objMyContext.objMainMenu].concat(objMyContext.objMenu), form: objMyContext.objFormParameters, records: result, sql: objSQLOptions })
    })
  } else {
    // Neither _OK nor _CANCEL: error!
    throw new Error(req.i18n.__('ERROR: Invalid form state (must be _OK or _CANCEL)'))
  }
})

module.exports = router
module.exports.deduplicateSQL = deduplicateSQL
