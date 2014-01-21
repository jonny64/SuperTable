define ['underscore', 'backbone'], (_, Backbone) ->
  class PageFetchingService
    constructor: (options) ->
      _.extend @, Backbone.Events
      
      @currentPage = 0      
      @listenTo options.app, 'more-button:click', =>
        @getPage(@currentPage + 1)
      
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
      @currentPage = index

    _fetchPage: (index) =>
      page = @pages[index]
      page.fetch
        error: =>
          page.collection.remove(page)
          delete @pages[index]
          #TODO replace with actual index when it come to
          # non-numerical indexes
          @currentPage = @pages.length
        dataType: 'text'
