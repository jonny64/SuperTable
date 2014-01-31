define ['backbone', 'templates/header'], (Backbone, template) ->
  class FooterView extends Backbone.View
    el: '@header'
    events:
      'click @more-button': '_onClickMore'
      'click @next-page': '_onClickNext'
      'click @prev-page': '_onClickPrev'

    initialize: ->
      @listenTo @model, 'change:data', =>
        @renderBindVals()
      @listenTo @options.app, 'scroll:bottom', =>
        @_enableMore() if @model.lastPage() < @model.totalPages()
      @listenTo @options.app, 'scroll', @_disableMore

    render: ->
      @$el.html template()
      @_assignUi()
      @renderBindVals()
      @

    renderBindVals: =>
      @$firstRow.html(firstRow = @model.firstRow() || '?')
      @$lastRow.html(lastRow = @model.lastRow() || '?')
      @$totalRows.html(totalRows = @model.get('tableInfo')?.totalRows || '?')

      if firstRow > 1 then @enablePrev() else @disablePrev()
      if lastRow < totalRows
        @enableNext()
      else
        @disableNext()
      
    _assignUi: ->
      @$moreButton = @$('@more-button')
      @$nextPage = @$('@next-page')
      @$prevPage = @$('@prev-page')
      @$firstRow = @$('@first-row')
      @$lastRow = @$('@last-row')
      @$totalRows = @$('@total-rows')
      
    _onClickMore: (e) ->
      return e.preventDefault() if @$moreButton.hasClass('disabled')
      @_disableMore()
      @options.app.trigger 'more-button:click'

    _onClickNext: (e) ->
      return e.preventDefault() if @$nextPage.hasClass('disabled')
      @options.app.trigger 'next-page:click'

    _onClickPrev: (e) ->
      return e.preventDefault() if @$prevPage.hasClass('disabled')
      @options.app.trigger 'prev-page:click'

    _disableMore: -> @$moreButton.addClass('disabled')
    _enableMore: -> @$moreButton.removeClass('disabled')
    disableNext: -> @$nextPage.addClass('disabled')
    enableNext: -> @$nextPage.removeClass('disabled')
    disablePrev: -> @$prevPage.addClass('disabled')
    enablePrev: -> @$prevPage.removeClass('disabled')
