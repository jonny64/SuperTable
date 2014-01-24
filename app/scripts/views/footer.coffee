define ['backbone', 'templates/footer'], (Backbone, template) ->
  class FooterView extends Backbone.View
    events:
      'click @more-button': '_onClickMore'

    initialize: ->
      @listenTo @options.app, 'scroll:bottom', @_show

    render: ->
      @$el.html template()
      @_hide()
      @

    _onClickMore: (e) ->
      @_hide()
      @options.app.trigger 'more-button:click'

    _hide: ->
      @$el.hide()

    _show: ->
      @$el.show()
