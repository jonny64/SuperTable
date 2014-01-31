define ['underscore', 'backbone'], (_, Backbone) ->
  class PageFetchingService
    constructor: (options) ->
      _.extend @, Backbone.Events

      @app = options.app
      @listenTo options.app, 'more-button:click', =>
        page = @table.lastPage() + 1
        if page <= @table.totalPages() then @mergePage(page)
      @listenTo options.app, 'next-page:click', =>
        page = @table.lastPage() + 1
        if page <= @table.totalPages() then @getPage(page)
      @listenTo options.app, 'prev-page:click', =>
        page = @table.firstPage() - 1
        if page > 0 then @getPage(page)

      #TODO api object/service
      @pageUrl = options.pageUrl
      @table = options.table
      @getTable()

    getTable: (options) =>
      @_fetchPage(null, 'table')

    mergePage: (index) =>
      @_fetchPage(index, 'merge')
      
    getPage: (index) =>
      @_fetchPage(index, 'get')

    _fetchPage: (index, type) =>
      @app.trigger 'page:loading'
      #TODO table.fetchPage with calculated url
      @table.fetch
        url: @_apiUrl(index, type)
        error: -> alert("Ошибка при загрузке страницы")
        dataType: 'json'
        fetchType: type

    _apiUrl: (index, type) ->
      switch type
        when 'table' then @table.url.replace('#{page}', '')
        else @table.url.replace('#{page}', index)

