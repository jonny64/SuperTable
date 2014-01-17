define [
  'backbone',
  'models/table',
  'views/table',
  'collections/page',
  'services/page_fetching'
], (Backbone, TableModel, TableView, PageCollection, PageFetchingService) ->
  
  class App
    initialize: (options) ->
      console.log 'app starting...'
      
      unless options.url
        console.log 'url is a mandatory parameter'
        return false
        
      el = options.el || 'body'

      pages = new PageCollection()
      table = new TableModel()
      table.set 'pages', pages
      view = new TableView(el: el, model: table, collection: pages)

      view.render()

      pageFetchingService = new PageFetchingService
        collection: pages
        url: options.url

      pageFetchingService.getPage(0)
      pageFetchingService.getPage(1)
