define [
  'underscore',
  'backbone',
  'models/table',
  'views/layout',
  'services/page_fetching'
], (_, Backbone, TableModel, LayoutView, PageFetchingService) ->

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

      pageFetchingService.getTable()

    elWidth: (obj) ->
      Math.max obj.clientWidth, obj.offsetWidth, obj.scrollWidth

    elHeight: (obj) ->
      Math.max obj.clientHeight, obj.offsetHeight, obj.scrollHeight
