define [
  'underscore',
  'jquery',
  'backbone',
  'templates/_sort_block'], (_, $, Backbone) ->
  class Sorting
    constructor: (options) ->
      _.extend @, Backbone.Events
      @model = options.model
      @app = options.app
      @$container = $(options.container)
      @_assignHandlers()
      @setSorting()
      @listenTo @model, 'change:order', @setSorting

    _assignHandlers: =>
      @$container.on 'click', '[data-order-dir]', @_onClickSort

    _onClickSort: (e) =>
      @app.log 'sort click'
      $el = $(e.currentTarget)
      orderId = $el.closest('td, th').attr('id')
      clickedDir = $el.data('order-dir')
      sort = {}
      order = _.clone(@model.get('order'))
      if !$el.hasClass("active") or _.size(order) > 1
        sort[orderId] = clickedDir
      if e.ctrlKey
        order[orderId] = clickedDir
        @model.set 'order', order
      else
        @model.set 'order', sort
      @app.trigger 'table:sort'

    setSorting: =>
      @$container.find("div.st-sort-block > span[data-order-dir]").removeClass("active")
      _(@model.get('order')).each((dir, id) =>
        @$container.find("##{id} span[data-order-dir=\"#{dir}\"]").addClass("active"))
