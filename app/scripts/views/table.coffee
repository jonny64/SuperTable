define ['backbone', 'views/page'], (Backbone, PageView) ->
  class TableView extends Backbone.View
    itemView: PageView
    initialize: ->
      if @collection
        @listenTo @collection, 'add', @addItem
        @listenTo @collection, 'remove', @removeItem
        @listenTo @collection, 'reset', @resetCollection
      @views = {}
        
    render: ->
      @resetCollection()
      @collection.each @addItem
      @

    addItem: (model) =>
      view = new @itemView(model: model)
      @$el.append view.render().el
      console.log "add item: #{model.cid}"
      @views[model.cid] = view

    removeItem: (model) ->
      console.log "remove item: #{model.cid}"
      @views[model.cid].remove()
      delete @views[model.cid]

    resetCollection: ->
      @$el.empty()
      @views = {}
