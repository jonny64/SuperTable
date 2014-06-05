define ['backbone', 'templates/header', 'templates/empty_header'],
(Backbone, template, emptyTemplate) ->
  class FooterView extends Backbone.View
    events:
      'click @more-button': '_onClickMore'
      'click @next-page': '_onClickNext'
      'click @prev-page': '_onClickPrev'
      'click @first-page': '_onClickFirst'
      'click @last-page': '_onClickLast'

    initialize: ->
      @listenTo @model, 'change', @render
      @listenTo @options.app, 'scroll:bottom', =>
        @_enableMore() unless @model.lastPage()
      @listenTo @options.app, 'scroll', @_disableMore

    render: =>
      if @model.get('pager_off')
        @$el.hide()
      else
        @$el.show()
        if parseInt(@model.get('cnt'), 10) > 0
          @$el.html template()
          @_assignUi()
          @renderBindVals()
        else
          @$el.html emptyTemplate(msg: @model.get('empty_label'))
      @

    renderBindVals: =>
      @$firstRow.html(@model.start() + 1 || '?')
      @$lastRow.html(@model.start() + @model.cnt() || '?')
      @$totalRows.html(@model.total() || '?')

      if !@model.firstPage() then @enablePrev() else @disablePrev()
      if !@model.lastPage() then @enableNext() else @disableNext()

    _assignUi: ->
      @$moreButton = @$('@more-button')
      @$nextPage = @$('@next-page')
      @$prevPage = @$('@prev-page')
      @$firstPage = @$('@first-page')
      @$lastPage = @$('@last-page')
      @$firstRow = @$('@first-row')
      @$lastRow = @$('@last-row')
      @$totalRows = @$('@total-rows')

    _preventDefault: (e) ->
      e.preventDefault()
      e.stopPropagation()
      false

    _onClickMore: (e) ->
      @_preventDefault(e)
      return if @$moreButton.hasClass('disabled')
      @_disableMore()
      @options.app.trigger 'more-button:click'
      false

    _onClickNext: (e) ->
      @_preventDefault(e)
      return if @$nextPage.hasClass('disabled')
      @options.app.trigger 'next-page:click'
      false

    _onClickPrev: (e) ->
      @_preventDefault(e)
      return if @$prevPage.hasClass('disabled')
      @options.app.trigger 'prev-page:click'
      false

    _onClickLast: (e) ->
      @_preventDefault(e)
      return if @$lastPage.hasClass('disabled')
      @options.app.trigger 'last-page:click'
      false

    _onClickFirst: (e) ->
      @_preventDefault(e)
      return if @$firstPage.hasClass('disabled')
      @options.app.trigger 'first-page:click'
      false

    _disableMore: -> @$moreButton.addClass('disabled')
    _enableMore: -> @$moreButton.removeClass('disabled')

    disableNext: =>
      @$nextPage.addClass('disabled')
      @$lastPage.addClass('disabled')

    enableNext: =>
      @$nextPage.removeClass('disabled')
      @$lastPage.removeClass('disabled')

    disablePrev: =>
      @$prevPage.addClass('disabled')
      @$firstPage.addClass('disabled')

    enablePrev: =>
      @$prevPage.removeClass('disabled')
      @$firstPage.removeClass('disabled')
