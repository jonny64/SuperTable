define ['underscore', 'backbone'], (_, Backbone) ->
  class PageFetchingService
    constructor: (options) ->
      _.extend @, Backbone.Events

      @app = options.app
      @listenTo options.app, 'more-button:click', =>
        @getPage(1 + @lastPage())

      #TODO api object/service
      @pageUrl = options.pageUrl
      @table = options.table
      @getTable()

    getTable: (options) =>
      @app.trigger 'page:loading'
      @table.fetch
        success: -> options?.success?()
        dataType: 'json'

    getPage: (index) =>
      if @table.get('header')
        @_fetchPage(index)
      else
        @getTable
          success: => @_fetchPage(index)

    _fetchPage: (index) =>
      @app.trigger 'page:loading'
      #TODO table.fetchPage with calculated url
      @table.fetch
        url: @pageUrl
        dataType: 'json'

    lastPage: =>
      body = @table.get('data')
      tableInfo = @table.get('tableInfo')
      Math.ceil(body.length / tableInfo.rowsOnPage)
