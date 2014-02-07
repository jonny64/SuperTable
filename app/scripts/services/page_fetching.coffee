define ['underscore', 'backbone'], (_, Backbone) ->
  class PageFetchingService
    constructor: (options) ->
      _.extend @, Backbone.Events

      @app = options.app
      @log = options.app.log
      @listenTo options.app, 'more-button:click', =>
        page = @table.lastPage() + 1
        if page <= @table.totalPages() then @mergePage(page)
      @listenTo options.app, 'next-page:click', =>
        page = @table.lastPage() + 1
        if page <= @table.totalPages() then @getPage(page)
      @listenTo options.app, 'prev-page:click', =>
        page = @table.firstPage() - 1
        if page > 0 then @getPage(page)
      @listenTo options.app, 'sort:click', @getTable

      #TODO api object/service
      @pageUrl = options.pageUrl
      @table = options.table

    getTable: (options) =>
      @_fetchPage(null, 'table')

    mergePage: (index) =>
      @_fetchPage(index, 'merge')
      
    getPage: (index) =>
      @_fetchPage(index, 'get')

    _fetchPage: (index, type) =>
      #console.log 'fetching page'
      @app.trigger 'page:loading'
      #TODO table.fetchPage with calculated url
      @table.fetch
        url: @_apiUrl(index, type)
        data: @_infoToParams(@table.get('tableInfo') || {})
        success: => @app.trigger 'page:loaded'
        error: -> alert("Ошибка при загрузке страницы")
        dataType: 'html'
        fetchType: type

    _apiUrl: (index, type) ->
      switch type
        when 'table' then @table.url.replace('#{page}', '')
        else @table.url.replace('#{page}', index)

    _infoToParams: (info) ->
      order: @_orderToString(info.order)

    _orderToString: (order) ->
      _(order).map((e) ->
                     pairs = _(e).pairs()
                     if pairs.length
                       if pairs[0]?[1] == 'asc'
                         pairs[0][0]
                       else
                         pairs[0].join(":"))
              .join(",")
