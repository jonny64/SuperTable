define [
  'underscore',
  'backbone',
  'models/table',
  'views/layout',
  'services/table_state',
  'services/table_api'
], (_, Backbone, TableModel, LayoutView, TableState, TableAPI) ->

  class App
    @version: '0.1.4'
    log: (msg) -> window.console?.log?(msg)
    constructor: (options) ->
      _.extend @, Backbone.Events

      @log "app starting version #{App.version}..."

      unless options.tableUrl
        @log 'url is a mandatory parameter'
        return false

      el = options.el || 'body'

      table = new TableModel({}, {url: options.tableUrl})
      layoutView = new LayoutView(app: @, el: el, table: table)

      layoutView.render()

      tableState = new TableState
        app: @
        table: table
        el: layoutView.table.el

      tableAPI = new TableAPI
        app: @
        table: table
        tableState: tableState
        pageUrl: options.pageUrl


      tableAPI.getPage()

    elWidth: (obj) ->
      Math.max obj.clientWidth, obj.offsetWidth, obj.scrollWidth

    elHeight: (obj) ->
      Math.max obj.clientHeight, obj.offsetHeight, obj.scrollHeight

    cancelSelection: ->
      if document.selection
        document.selection.empty()
      else if window.getSelection
        try
          window.getSelection().collapseToStart()

