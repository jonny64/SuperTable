define ['backbone'], (Backbone) ->
  class PageView extends Backbone.View
    initialize: ->
      @listenTo(@model, 'sync', @render) if @model

    render: ->
      if @model?.get('content')?
        @$el.replaceWith @model.get('content')
      else
        @$el.spin()
      @trigger 'rendered'
      @
