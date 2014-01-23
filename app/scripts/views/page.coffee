define ['backbone'], (Backbone) ->
  class PageView extends Backbone.View
    initialize: ->
      @listenTo(@model, 'sync', @render) if @model

    render: ->
      @$el.replaceWith @model.get('content') if @model?.get('content')?
      @trigger 'rendered'
      @
