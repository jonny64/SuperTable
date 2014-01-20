define ['underscore'], (_) ->
  class PageFetchingService
    constructor: (options) ->
      @collection = options.collection
      #TODO api object/service
      @url = options.url
      @pages = {}

    getPage: (index) =>
      if @pages[index]
        #TODO something with expire maybe?
        @_fetchPage(index)
      else
        page = new @collection.model({index: index}, {url: @url})
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
