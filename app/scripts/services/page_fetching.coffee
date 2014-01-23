define ['underscore', 'backbone'], (_, Backbone) ->
  class PageFetchingService
    constructor: (options) ->
      _.extend @, Backbone.Events

      @listenTo options.app, 'more-button:click', =>
        @getPage(1 + @lastPage())

      @collection = options.collection
      #TODO api object/service
      @pageUrl = options.pageUrl
      @pages = {}
      @table = options.table
      @getTable()

    getTable: (options) =>
      @table.fetch
        success: -> options?.success?()
        dataType: 'text'

    getPage: (index) =>
      if @table.get('content')
        @_cachePage(index)
      else
        @getTable
          success: => @_cachePage(index)

    _cachePage: (index) =>
      if @pages[index]
        #TODO something with expire maybe?
        @_fetchPage(index)
      else
        page = new @collection.model({index: index}, {url: @pageUrl})
        @collection.add page
        @pages[index] = page
        @_fetchPage(index)

    _fetchPage: (index) =>
      page = @pages[index]
      page.fetch
        error: =>
          page.collection.remove(page)
          delete @pages[index]
        dataType: 'text'

    lastPage: =>
      _(@pages)
        .chain()
        .keys()
        .map((e) -> parseInt(e, 10))
        .max()
        .value()
