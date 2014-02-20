define [
  'underscore',
  'backbone',
  'models/table',
  'views/layout',
  'services/page_fetching',
  'services/table_state_api'
], (_, Backbone, TableModel, LayoutView, PageFetchingService, TableStateApi) ->

  class App
    version: '0.1.2'
    log: (msg) -> window.console?.log?(msg)
    initialize: (options) ->
      _.extend @, Backbone.Events

      @log "app starting version #{@version}..."

      unless options.tableUrl
        @log 'url is a mandatory parameter'
        return false

      el = options.el || 'body'

      table = new TableModel({}, {url: options.tableUrl})
      layoutView = new LayoutView(app: @, el: el, table: table)

      layoutView.render()

      pageFetchingService = new PageFetchingService
        app: @
        table: table
        pageUrl: options.pageUrl

      tableStateApi = new TableStateApi
        app: @
        table: table
        el: layoutView.table.tableContainer

      pageFetchingService.getTable()

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

