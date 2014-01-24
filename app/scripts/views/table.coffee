define ['backbone', 'views/page'], (Backbone, PageView) ->
  class TableView extends Backbone.View
    itemView: PageView
    events:
      'scroll': '_onScroll'
      
    initialize: ->
      @listenTo @model, 'change:content', @render
      if @collection
        @listenTo @collection, 'add', @addItem
        @listenTo @collection, 'remove', @removeItem
        @listenTo @collection, 'reset', @resetCollection
      @views = {}
        
    render: (options) ->
      @width ||= options?.width || 800
      @height ||= options?.height || 1200
      console.log "table dims: w:#{@width} h:#{@height}"
      @resetCollection()
      if @model.get('content')
        @$el.html @model.get('content')
        @$('table').attr 'role', 'table'
        @$('tbody').attr 'role', 'table-body'
        @$('thead').attr 'role', 'table-head'
        @collection.each @addItem
        @_fixHead()
      @

    _fixHead: =>
      @$('@table').fixedHeaderTable 'destroy'
      @$('@table').fixedHeaderTable
        height: "" + @height
        width: "" + @width
        fixedColumn: true
      @$sc = @$('.fht-fixed-body .fht-tbody')
      @$sc.scroll(@_onScroll)

    addItem: (model) =>
      view = new @itemView(model: model)
      @listenTo view, 'rendered', @_fixHead
      @$('@table-body').append view.render().el
      console.log "add item: #{model.cid}"
      @views[model.cid] = view

    removeItem: (model) ->
      console.log "remove item: #{model.cid}"
      @views[model.cid].remove()
      delete @views[model.cid]

    resetCollection: ->
      @$el.empty()
      @views = {}

    _onScroll: (e) =>
      if (@$sc.prop('scrollHeight') <= (@$sc.scrollTop() + @$sc.height()))
        @options.app.trigger 'scroll:bottom'
