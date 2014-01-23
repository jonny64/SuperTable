define ['backbone', 'templates/footer'], (Backbone, template) ->
  class FooterView extends Backbone.View
    events:
      'click @more-button': '_onClickMore'

    render: ->
      @$el.html template()
      @

    _onClickMore: (e) ->
      @options.app.trigger 'more-button:click'
