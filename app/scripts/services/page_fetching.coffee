define ['underscore', 'backbone'], (_, Backbone) ->
  class PageFetchingService
    constructor: (options) ->
      _.extend @, Backbone.Events

      @app = options.app
      @log = @app.log
      @listenTo options.app, 'more-button:click', =>
        if !@table.lastPage() then @mergePage(@table.nextPage())
      @listenTo options.app, 'next-page:click', =>
        if !@table.lastPage() then @getPage(@table.nextPage())
      @listenTo options.app, 'prev-page:click', =>
        if !@table.firstPage() then @getPage(@table.prevPage())
      @listenTo options.app, 'sort:click', @getTable

      #TODO api object/service
      @pageUrl = options.pageUrl
      @table = options.table

    getTable: (options) =>
      @_fetchPage(0, 'init')

    mergePage: (index) =>
      @_fetchPage(index, 'mergePage')

    getPage: (index) =>
      @_fetchPage(index, 'page')

    _fetchPage: (index, type) =>
      @log 'fetching page'
      @table.set 'fetchType', type
      @app.trigger 'page:loading'
      #TODO table.fetchPage with calculated url
      @table.fetch
        url: @_apiUrl(index, type)
        data: @_infoToParams(start: index)
        success: => @app.trigger 'page:loaded'
        error: -> alert("Ошибка при загрузке страницы")
        dataType: 'json'

    _apiUrl: (index, type) ->
      @table.url.replace('#{page}', index)

    _infoToParams: (options) =>
      computed =
        order: @_orderToString(@table.get('order'))
      _.extend {}, options, computed

    _orderToString: (order) ->
      _(order).map((dir, id) -> "#{id}:#{dir}").join(",")
