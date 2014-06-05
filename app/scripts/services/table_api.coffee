define ['underscore', 'backbone'], (_, Backbone) ->
  class TableAPI
    constructor: (options) ->
      _.extend @, Backbone.Events

      @app = options.app
      @log = @app.log
      state = options.tableState

      @listenTo options.app, 'more-button:click', =>
        if !@table.lastPage()
          @getPage(@table.nextPage(), 'mergePage')
      @listenTo options.app, 'next-page:click', =>
        if !@table.lastPage()
          @getPage(@table.nextPage())
      @listenTo options.app, 'prev-page:click', =>
        if !@table.firstPage()
          @getPage(@table.prevPage())
      @listenTo options.app, 'first-page:click', =>
        if !@table.firstPage()
          @getPage(0)
      @listenTo options.app, 'last-page:click', =>
        if !@table.lastPage()
          @getPage(@table.lastPageStart())
      @listenTo options.app, 'table:sort', =>
        @postPage(action: 'update_columns', sort: 1, columns: state.columnsStr())
      @listenTo options.app, 'table:reorder', =>
        @postPage(action: 'update_columns', order: 1, columns: state.columnsStr())
      @listenTo options.app, 'table:widths', =>
        @_saveState(data: {action: 'update_dimensions', columns: state.columnsStr() })

      #TODO api object/service
      @pageUrl = options.pageUrl
      @table = options.table

    getPage: (start=0, fetchType='page') =>
      @_fetchPage {data: {start: start}, fetchType: fetchType}

    postPage: (data) =>
      @_fetchPage {data: data, method: 'POST'}

    _withDefaults: (options) =>
      data = _.extend({ start: @table.start() || 0},
                      options.data,
                      @table.get('datasource_params'))
      _.extend({}, {data: data, fetchType: 'page', method: 'GET'}, _.omit(options, 'data'))

    _fetchPage: (options) =>
      options = @_withDefaults(options)
      @log 'fetching page'
      @table.set 'fetchType', options.fetchType
      @app.trigger 'page:loading'
      #TODO table.fetchPage with calculated url
      @table.fetch
        url: @_apiUrl(options.data.start)
        data: options.data
        method: options.method
        success: => @app.trigger 'page:loaded'
        error: -> alert("Ошибка при загрузке страницы")
        dataType: 'json'

    _saveState: (options) =>
      options = @_withDefaults(options)
      Backbone.$.ajax
        method: 'POST'
        url: @table.url
        data: options.data

    _apiUrl: (index) ->
      @table.url.replace('#{page}', index)
