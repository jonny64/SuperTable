define [
  'underscore',
  'backbone',
  'models/table',
  'views/layout',
  'services/page_fetching'
], (_, Backbone, TableModel, LayoutView, PageFetchingService) ->

  class App
    version: '0.1.2'
    initialize: (options) ->
      _.extend @, Backbone.Events

      console.log "app starting version #{@version}..."

      unless options.pageUrl and options.tableUrl
        console.log 'url is a mandatory parameter'
        return false

      el = options.el || 'body'

      table = new TableModel({}, {url: options.tableUrl})
      layoutView = new LayoutView(app: @, el: el, table: table)

      layoutView.render()

      pageFetchingService = new PageFetchingService
        app: @
        table: table
        pageUrl: options.pageUrl

      pageFetchingService.getPage(0)
