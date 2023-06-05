const express = require('express')
const bodyParser = require('body-parser')
const multer = require('multer')
const config = require('./config')
const initSSE = require('./sse').initSSE
const cache = require('./cache')
const setupAppMiddleware = require('./app-middleware')
const cors = require('cors')

/*
var whitelist = ['http://localhost:7777', 'http://localhost:3000']
var corsOptions = {
  origin: function (origin, callback) {
    if (!origin || whitelist.indexOf(origin) !== -1) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS: ' + origin))
    }
  }
}
*/

const views = {
  index: require('./views/index'),
  about: require('./views/about'),
  browse: require('./views/browse'),
  login: require('./views/login'),
  logout: require('./views/logout'),
  register: require('./views/register'),
  resetPassword: require('./views/resetPassword'),
  profile: require('./views/profile'),
  search: require('./views/search'),
  advancedSearch: require('./views/advancedSearch'),
  submit: require('./views/submit'),
  manage: require('./views/manage'),
  topLevel: require('./views/topLevel'),
  persistentIdentity: require('./views/persistentIdentity'),
  setup: require('./views/setup'),
  dataIntegration: require('./views/dataIntegration'),
  jobs: require('./views/jobs'),
  sparql: require('./views/sparql'),
  addOwner: require('./views/addOwner'),
  shared: require('./views/shared'),
  visualization: require('./views/visualization'),
  logo: require('./views/logo'),
  stream: require('./views/stream'),
  sbsearch: require('./views/sbsearch'),
  addToCollection: require('./views/addToCollection'),
  admin: {
    explorer: require('./views/admin/explorer'),
    status: require('./views/admin/status'),
    graphs: require('./views/admin/graphs'),
    sparql: require('./views/admin/sparql'),
    remotes: require('./views/admin/remotes'),
    users: require('./views/admin/users'),
    newUser: require('./views/admin/newUser'),
    jobs: require('./views/admin/jobs'),
    theme: require('./views/admin/theme'),
    //    backup: require('./views/admin/backup'),
    //    backupRestore: require('./views/admin/backupRestore'),
    registries: require('./views/admin/registries'),
    mail: require('./views/admin/mail'),
    log: require('./views/admin/log'),
    plugins: require('./views/admin/plugins')
  }
}

const api = {
  search: require('./api/search'),
  sbol: require('./api/sbol'),
  sbolnr: require('./api/sbolnr'),
  persistentIdentity: require('./api/persistentIdentity'),
  fasta: require('./api/fasta'),
  genBank: require('./api/genBank'),
  gff3: require('./api/gff3'),
  metadata: require('./api/metadata'),
  autocomplete: require('./api/autocomplete'),
  count: require('./api/count'),
  healthCheck: require('./api/healthCheck'),
  rootCollections: require('./api/rootCollections'),
  subCollections: require('./api/subCollections'),
  download: require('./api/download'),
  datatables: require('./api/datatables'),
  sparql: require('./api/sparql'),
  stream: require('./api/stream'),
  updateWebOfRegistries: require('./api/updateWebOfRegistries'),
  editObject: require('./api/editObject'),
  addObject: require('./api/addObject'),
  removeObject: require('./api/removeObject'),
  attachUrl: require('./api/attachUrl'),
  expose: require('./api/expose').serveExpose,
  admin: {
    sparql: require('./api/admin/sparql')
  }
}

const actions = {
  makePublic: require('./actions/makePublic'),
  copyFromRemote: require('./actions/copyFromRemote'),
  createBenchlingSequence: require('./actions/createBenchlingSequence'),
  createICEPart: require('./actions/createICEPart'),
  removeCollection: require('./actions/removeCollection'),
  resetPassword: require('./actions/resetPassword'),
  setNewPassword: require('./actions/setNewPassword'),
  remove: require('./actions/remove'),
  removeMembership: require('./actions/removeMembership'),
  replace: require('./actions/replace'),
  createImplementation: require('./actions/createImplementation'),
  createTest: require('./actions/createTest'),
  updateMutableDescription: require('./actions/updateMutableDescription'),
  updateMutableNotes: require('./actions/updateMutableNotes'),
  updateMutableSource: require('./actions/updateMutableSource'),
  updateCitations: require('./actions/updateCitations'),
  cancelJob: require('./actions/cancelJob'),
  restartJob: require('./actions/restartJob'),
  upload: require('./actions/upload'),
  createSnapshot: require('./actions/createSnapshot'),
  updateCollectionIcon: require('./actions/updateCollectionIcon'),
  removeOwner: require('./actions/removeOwnedBy'),
  getPlugins: require('./plugins/getPlugins'),
  callPlugin: require('./plugins/pluginEndpoints'),
  admin: {
    saveRemote: require('./actions/admin/saveRemote'),
    saveRegistry: require('./actions/admin/saveRegistry'),
    deleteRegistry: require('./actions/admin/deleteRegistry'),
    savePlugin: require('./actions/admin/savePlugin'),
    deletePlugin: require('./actions/admin/deletePlugin'),
    deleteRemote: require('./actions/admin/deleteRemote'),
    updateUser: require('./actions/admin/updateUser'),
    deleteUser: require('./actions/admin/deleteUser'),
    federate: require('./actions/admin/federate'),
    retrieve: require('./actions/admin/retrieveFromWoR'),
    explorerUpdateIndex: require('./actions/admin/explorerUpdateIndex'),
    setAdministratorEmail: require('./actions/admin/updateAdministratorEmail'),
    explorerLog: require('./actions/admin/explorerLog'),
    explorerIndexingLog: require('./actions/admin/explorerIndexingLog')
  }
}

function App () {
  const app = express()

  setupAppMiddleware(app)

  // use cors
  app.use(cors())

  const uploadToMemory = multer({
    storage: multer.memoryStorage({})
  })

  initSSE(app)

  // Data integration experimental endpoints created by James McLaughlin
  if (config.get('experimental').dataIntegration) {
    app.get('/jobs', requireUser, views.jobs)
    app.post('/actions/job/cancel', requireUser, actions.cancelJob)
    app.post('/actions/job/restart', requireUser, actions.restartJob)
    app.get('/admin/jobs', requireAdmin, views.admin.jobs)
    app.all('/user/:userId/:collectionId/:displayId/:version([^\\.]+)/integrate', requireUser, views.dataIntegration)
    app.all('/public/:collectionId/:displayId/:version([^\\.]+)/integrate', views.dataIntegration)
    app.get('/user/:userId/:collectionId/:displayId/:version/createImplementation', requireUser, actions.createImplementation)
    app.get('/user/:userId/:collectionId/:displayId/:version/createTest', requireUser, actions.createTest)
    // TODO: need to decide if createSnapshot is functional and should be kept or not
    app.get('/public/:collectionId/:displayId/:version/createSnapshot', actions.createSnapshot)
  }

  app.get('/', views.index)
  app.get('/about', views.about)

  if (config.get('firstLaunch')) {
    app.get('/setup', views.setup)
    app.post('/setup', uploadToMemory.single('logo'), views.setup)
  }

  app.all('/browse', views.browse)

  function forceNoHTML (req, res, next) { // User Endpoints
    req.forceNoHTML = true

    next()
  }

  // User Endpoints on API docs
  if (config.get('allowPublicSignup')) {
    app.post('/register', views.register)
  }
  app.post('/login', views.login)
  app.post('/logout', views.logout)
  app.post('/resetPassword/token/:token', actions.resetPassword)
  app.post('/resetPassword', views.resetPassword)
  app.post('/setNewPassword', actions.setNewPassword)
  app.all('/profile', requireUser, views.profile)

  // Search Endpoints
  app.get('/search/:query?', views.search) //search metadata and search sequence
  app.get('/searchCount/:query?', views.search)
  app.get('/rootCollections', api.rootCollections)
  app.get('/manage', requireUser, views.manage)
  app.get('/shared', requireUser, views.shared)

  app.get('/public/:collectionId/:displayId/:version/subCollections', api.subCollections)
  app.get('/public/:collectionId/:displayId/:version/twins', views.search)
  app.get('/public/:collectionId/:displayId/:version/uses', views.search)
  app.get('/public/:collectionId/:displayId/:version/similar', views.search)

  app.get('/user/:userId/:collectionId/:displayId/:version/subCollections', api.subCollections)
  app.get('/user/:userId/:collectionId/:displayId/:version/twins', views.search)
  app.get('/user/:userId/:collectionId/:displayId/:version/uses', views.search)
  app.get('/user/:userId/:collectionId/:displayId/:version/similar', views.search)

  app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/subCollections', api.subCollections)
  app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/twins', views.search)
  app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/uses', views.search)
  app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/similar', views.search)

  app.get('/:type/count', api.count)
  app.get('/sparql?query=:query', sparql)

  // Download Endpoints
  app.get('/public/:collectionId/:displayId/sbol', api.persistentIdentity)
  app.get('/public/:collectionId/:displayId/sbolnr', api.persistentIdentity)
  app.get('/user/:userId/:collectionId/:displayId/sbol', api.persistentIdentity)
  app.get('/user/:userId/:collectionId/:displayId/sbolnr', api.persistentIdentity)

  app.get('/public/:collectionId/:displayId/:version/sbol', api.sbol)
  app.get('/public/:collectionId/:displayId/:version/sbolnr', api.sbolnr)
  app.get('/public/:collectionId/:displayId/:version/fasta', api.fasta)
  app.get('/public/:collectionId/:displayId/:version/gb', api.genBank)
  app.get('/public/:collectionId/:displayId/:version/gff', api.gff3)
  app.get('/public/:collectionId/:displayId/:version/metadata', api.metadata)

  app.get('/user/:userId/:collectionId/:displayId/:version/sbol', api.sbol)
  app.get('/user/:userId/:collectionId/:displayId/:version/sbolnr', api.sbolnr)
  app.get('/user/:userId/:collectionId/:displayId/:version/fasta', api.fasta)
  app.get('/user/:userId/:collectionId/:displayId/:version/gb', api.genBank)
  app.get('/user/:userId/:collectionId/:displayId/:version/gff', api.gff3)
  app.get('/user/:userId/:collectionId/:displayId/:version/metadata', api.metadata)

  app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/sbol', api.sbol)
  app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/sbolnr', api.sbolnr)
  app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/fasta', api.fasta)
  app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/gb', api.genBank)
  app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/gff', api.gff3)
  app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/metadata', api.metadata)

  app.get('/public/:collectionId/:displayId/:version/download', api.download)
  app.get('/user/:userId/:collectionId/:displayId/:version/download', requireUser, api.download)
  app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/download', api.download)

  // Submission Endpoints
  app.post('/submit/', requireUser, views.submit)
  app.post('/user/:userId/:collectionId/:displayId/:version/makePublic', requireUser, uploadToMemory.single('file'), actions.makePublic)
  app.post('/user/:userId/:collectionId/:displayId/:version/:hash/share/makePublic', uploadToMemory.single('file'), actions.makePublic)
  app.get('/public/:collectionId/:displayId/:version/removeCollection', requireAdmin, actions.removeCollection)
  app.get('/user/:userId/:collectionId/:displayId/:version/removeCollection', requireUser, actions.removeCollection)
  app.get('/user/:userId/:collectionId/:displayId/:version/remove', requireUser, actions.remove)
  app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/remove', actions.remove)
  app.get('/user/:userId/:collectionId/:displayId/:version/replace', requireUser, actions.replace)
  app.get('/user/:userId/:collectionId/:displayId/:version/:hash/share/replace', actions.replace)
  app.post('/public/:collectionId/:displayId/:version/icon', requireUser, uploadToMemory.single('collectionIcon'), actions.updateCollectionIcon)
 
  // Update Permissions Endpoints
  app.post('/public/:collectionId/:displayId/:version/addOwner', requireUser, views.addOwner)
  app.post('/public/:collectionId/:displayId/:version/removeOwner/:username', requireUser, actions.removeOwner)

  app.post('/user/:userId/:collectionId/:displayId/:version/addOwner', requireUser, views.addOwner)
  app.post('/user/:userId/:collectionId/:displayId/:version/removeOwner/:username', requireUser, actions.removeOwner)

  app.post('/user/:userId/:collectionId/:displayId/:version/:hash/share/addOwner', views.addOwner)
  app.post('/user/:userId/:collectionId/:displayId/:version/:hash/share/removeOwner/:username', actions.removeOwner)

  // Edit Mutable Fields Endpoints
  app.post('/updateMutableDescription', requireUser, actions.updateMutableDescription)
  app.post('/updateMutableNotes', requireUser, actions.updateMutableNotes)
  app.post('/updateMutableSource', requireUser, actions.updateMutableSource)
  app.post('/updateCitations', requireUser, actions.updateCitations)

  app.post('/user/:userId/:collectionId/:displayId/:version/edit/:field', requireUser, api.editObject)
  app.post('/user/:userId/:collectionId/:displayId/:version/add/:field', requireUser, api.addObject)
  app.post('/user/:userId/:collectionId/:displayId/:version/remove/:field', requireUser, api.removeObject)
  
  app.post('/public/:collectionId/:displayId/:version/addToCollection', requireUser, views.addToCollection)
  app.post('/user/:userId/:collectionId/:displayId/:version/addToCollection', requireUser, views.addToCollection)
  app.post('/user/:userId/:collectionId/:displayId/:version/removeMembership', requireUser, actions.removeMembership)
  app.post('/user/:userId/:collectionId/:displayId/:version/:hash/share/removeMembership', actions.removeMembership)

  // Attachment Endpoints
  app.post('/public/:collectionId/:displayId/:version/attach', requireUser, actions.upload)
  app.post('/public/:collectionId/:displayId/:version/attachUrl', requireUser, api.attachUrl)

  app.post('/user/:userId/:collectionId/:displayId/:version/attach', requireUser, actions.upload)
  app.post('/user/:userId/:collectionId/:displayId/:version/attachUrl', requireUser, api.attachUrl)

  app.post('/user/:userId/:collectionId/:displayId/:version/:hash/share/attach', actions.upload)
  app.post('/user/:userId/:collectionId/:displayId/:version/:hash/share/attachUrl', api.attachUrl)
  
  // Administration Endpoints
  app.get('/admin', requireAdmin, views.admin.status)
  app.get('/admin/virtuoso', api.healthCheck)  
  app.get('/admin/graphs', requireAdmin, views.admin.graphs)
  app.get('/admin/log', requireAdmin, views.admin.log)
  app.get('/admin/mail', requireAdmin, views.admin.mail)
  app.post('/admin/mail', requireAdmin, bodyParser.urlencoded({ extended: true }), views.admin.mail)
  app.get('/admin/plugins', views.admin.plugins)
  app.post('/admin/savePlugin', requireAdmin, bodyParser.urlencoded({ extended: true }), actions.admin.savePlugin)
  app.post('/admin/deletePlugin', requireAdmin, bodyParser.urlencoded({ extended: true }), actions.admin.deletePlugin)

  app.get('/admin/registries', requireAdmin, views.admin.registries)
  app.post('/admin/saveRegistry', requireAdmin, bodyParser.urlencoded({ extended: true }), actions.admin.saveRegistry)
  app.post('/admin/deleteRegistry', requireAdmin, bodyParser.urlencoded({ extended: true }), actions.admin.deleteRegistry)
  app.post('/admin/setAdministratorEmail', requireAdmin, bodyParser.urlencoded({ extended: true }), actions.admin.setAdministratorEmail)
  app.post('/admin/retrieveFromWebOfRegistries', requireAdmin, actions.admin.retrieve)
  app.post('/admin/federate', requireAdmin, bodyParser.urlencoded({ extended: true }), actions.admin.federate)

  // This endpoint is used by Web-of-Registries to update SynBioHub's list of registries
  app.get('/admin/sparql', requireAdmin, sparqlAdmin)
  app.post('/admin/sparql', requireAdmin, bodyParser.urlencoded({ extended: true }), sparqlAdmin)
  app.get('/admin/sparql?query=:query', requireAdmin, sparqlAdmin)

  app.get('/admin/remotes', requireAdmin, views.admin.remotes) //benchling and ice
  app.post('/admin/saveRemote', requireAdmin, bodyParser.urlencoded({ extended: true }), actions.admin.saveRemote)
  app.post('/admin/deleteRemote', requireAdmin, bodyParser.urlencoded({ extended: true }), actions.admin.deleteRemote)

  app.get('/admin/explorerlog', requireAdmin, actions.admin.explorerLog)
  app.get('/admin/explorer', requireAdmin, views.admin.explorer)
  app.post('/admin/explorer', requireAdmin, bodyParser.urlencoded({ extended: true }), views.admin.explorer)
  app.post('/admin/explorerUpdateIndex', requireAdmin, actions.admin.explorerUpdateIndex)
 
  app.get('/admin/theme', views.admin.theme)
  app.post('/admin/theme', requireAdmin, uploadToMemory.single('logo'), views.admin.theme)
  
  app.get('/admin/users', requireAdmin, views.admin.users)
  app.post('/admin/users', requireAdmin, views.admin.users)
  app.post('/admin/newUser', requireAdmin, bodyParser.urlencoded({ extended: true }), views.admin.newUser)
  app.post('/admin/updateUser', requireAdmin, bodyParser.urlencoded({ extended: true }), actions.admin.updateUser)
  app.post('/admin/deleteUser', requireAdmin, bodyParser.urlencoded({ extended: true }), actions.admin.deleteUser)

  function sparql (req, res) {
    // jena sends accept: */* and then complains when we send HTML
    // back. so only send html if the literal string text/html is present
    // in the accept header.

    let accept = req.header('accept')
    if (accept && accept.indexOf('text/html') !== -1) {
      views.sparql(req, res)
    } else {
      api.sparql(req, res)
    }
  }

  function sparqlAdmin (req, res) {
    // jena sends accept: */* and then complains when we send HTML
    // back. so only send html if the literal string text/html is present
    // in the accept header.

    let accept = req.header('accept')
    if (accept && accept.indexOf('text/html') !== -1) {
      views.admin.sparql(req, res)
    } else {
      api.admin.sparql(req, res)
    }
  }

  function requireUser (req, res, next) {
    if (!req.user) {
      if (!req.accepts('text/html')) {
        res.status(401).send('Login required')
      } else {
        res.redirect('/login?next=' + encodeURIComponent(req.url))
      }
    } else { next() }
  }

  function requireAdmin (req, res, next) {
    if (!req.user || !req.user.isAdmin) {
      if (!req.accepts('text/html')) {
        res.status(401).send('Administrator login required')
      } else {
        res.redirect('/login?next=' + encodeURIComponent(req.url))
      }
    } else { next() }
  }

  if (config.get('prewarmSearch')) {
    cache.update()
  }

  return app
}

module.exports = App