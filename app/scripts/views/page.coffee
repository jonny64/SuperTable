define ['backbone'], (Backbone) ->
  class PageView extends Backbone.View
    initialize: ->
      @listenTo(@model, 'sync', @render) if @model

    render: ->
      @$el.html @model.get('content') if @model?.get('content')?
      @
