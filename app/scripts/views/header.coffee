define ['backbone', 'templates/header'], (Backbone, template) ->
  class FooterView extends Backbone.View
    el: '@header'
    events:
      'click @more-button': '_onClickMore'

    initialize: ->
      @listenTo @options.app, 'scroll:bottom', @_enableMore
      @listenTo @options.app, 'scroll', @_disableMore

    render: ->
      @$el.html template()
      @_assignUi()
      @

    _assignUi: ->
      @$moreButton = @$('@more-button')
      @$nextPage = @$('@next-page')
      @$prevPage = @$('@prev-page')
      
    _onClickMore: (e) ->
      return e.preventDefault() if @$moreButton.hasClass('disabled')
      @_disableMore()
      @options.app.trigger 'more-button:click'

    _disableMore: -> @$moreButton.addClass('disabled')
    _enableMore: -> @$moreButton.removeClass('disabled')
    disableNext: -> @$nextPage.addClass('disabled')
    enableNext: -> @$nextPage.removeClass('disabled')
    disablePrev: -> @$prevPage.addClass('disabled')
    enablePrev: -> @$prevPage.removeClass('disabled')
