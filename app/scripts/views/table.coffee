define ['underscore', 'backbone', 'services/split_table'], (_, Backbone, SplitTable) ->
  class TableView extends Backbone.View
    el: '@table-container'
    initialize: ->
      @tableDefaults =
        columnWidth: 120
        borderWidth: 1
        rowHeight: 24
        width: 0
        height: 0

      @log = @options.app.log
      @listenTo @options.app, 'page:loading', @_startSpinner
      @listenTo @options.app, 'page:loaded', @_stopSpinner
      @listenTo @model, 'change', (model) =>
        if model.changed.data
          @_renderContainer(model.get('data'))
        else
          @_setSorting() if model.changed.order

      @prevScrollTop = 0
      @prevScrollLeft = 0
      @_tableRendered = false
      @_hitBottom = false

    render: ->
      @log 'render'
      @_scrollBarWidth()
      @_assignRegions()
      @_assignHandlers()
      html = @model.get('data')
      @_renderContainer(html) if html
      @

    onShow: ->
      if @_tableRendered
        @_setPanesSize()
        @_stopSpinner()
      else
        @$el.spin()

    _assignRegions: =>
      @containerWidth = @$el.width()
      @containerHeight = @$el.height()

      @$tableContainer = @$('.st-table-container')
      @tableContainer = @$tableContainer[0]
      @tableRightViewport = @tableContainer.querySelector(".st-table-right-viewport")
      @tableLeftViewport = @tableContainer.querySelector(".st-table-left-viewport")
      @headerRightPane = @tableContainer.querySelector(".st-table-header-right-pane")
      @headerLeftPane = @tableContainer.querySelector(".st-table-header-left-pane")

    _assignHandlers: =>
      @$tableContainer.on 'click', '[data-order]', @_onClickSort

    _onScroll: (e) =>
      return unless @tableRightViewport
      scrollLeft = @tableRightViewport.scrollLeft
      scrollTop = @tableRightViewport.scrollTop

      hScroll = Math.abs(scrollLeft - @prevScrollLeft)
      vScroll = Math.abs(scrollTop - @prevScrollTop)

      @prevScrollLeft = scrollLeft
      @prevScrollTop = scrollTop

      if hScroll
        @headerRightPane.scrollLeft = scrollLeft

      if vScroll
        @tableLeftViewport.scrollTop = scrollTop

        if (scrollTop + @tableRightViewport.clientHeight) >= @tableRightViewport.scrollHeight
          @options.app.trigger 'scroll:bottom'
          @_hitBottom = true
        else if @_hitBottom
          @options.app.trigger 'scroll'
          @_hitBottom = false

    _onClickSort: (e) =>
      @log 'sort click'
      $el = Backbone.$(e.currentTarget)
      orderId = $el.data('order')
      clickedDir = $el.data('order-dir')
      sort = {}
      unless $el.hasClass("active")
        sort[orderId] = clickedDir
      if e.ctrlKey
        # first we remove from order list existing orderId sorting
        #@model.get('order') = _(@model.get('order')).reject((e) -> e[orderId])
        #@model.get('order').push(sort) if _.size(sort)
      else
        @tableInfo.order = [sort]
      @_setSorting()
      @options.app.trigger 'sort:click'

    _setSorting: =>
      @$tableContainer.find("span.sortable").removeClass("active")
      _(@model.get('order')).each((id, dir) =>
        @$tableContainer.find("span#{id}[data-order-dir=\"#{dir}\"]").addClass("active"))

    _renderContainer: (data) =>
      return unless data
      @log 'render container'
      @_startSpinner()

      tables = new SplitTable(data, @tableDefaults, @model)

      @log 'insert header'
      if tables.top.left
        @headerLeftPane.innerHTML = ''
        @headerLeftPane.appendChild tables.top.left
        @headerLeftColumns = @headerLeftPane.querySelector('table')
        @leftWidth = @_elWidth(@headerLeftColumns)

      if tables.top.right
        @headerRightPane.innerHTML = ''
        @headerRightPane.appendChild tables.top.right if tables.top.right
        @headerRightColumns = @headerRightPane.querySelector('table')
        @rightWidth = @_elWidth(@headerRightColumns)
        @headerHeight = tables.top.height

      @log 'insert data'
      if @model.get('fetchType') == 'page'
        @tableLeftViewport.innerHTML = ''
        @tableRightViewport.innerHTML = ''
      @tableLeftViewport.appendChild tables.bottom.left
      @tableRightViewport.appendChild tables.bottom.right

      @tableRightViewport.onscroll = @_onScroll

      @_tableRendered = true
      @_setPanesSize()
      @_stopSpinner()

    _stopSpinner: =>
      @$el.spin(false)

    _startSpinner: =>
      @$el.spin(true)

    _setPanesSize: =>
      @log 'set panes size'
      return unless (@tableDefaults.width - @containerWidth) + (@tableDefaults.height - @containerHeight)

      @log "setting sizes for width: #{@containerWidth}, height: #{@containerHeight}"
      @tableDefaults.width = @containerWidth
      @tableDefaults.height = @containerHeight

      fixedColumnsWidth = @leftWidth
      rightCanvasWidth = @rightWidth

      scrollWidth = @_scrollBarWidth()
      borderWidth = @tableDefaults.borderWidth

      rightPaneWidth = _.min([@containerWidth - fixedColumnsWidth, rightCanvasWidth + scrollWidth])
      paneHeight = @containerHeight - @headerHeight

      @tableContainer.style.width = "#{@containerWidth}px"
      @tableContainer.style.height = "#{@containerHeight}px"

      @headerLeftPane.style.width = "#{fixedColumnsWidth}px"
      @headerRightPane.style.left = "#{fixedColumnsWidth}px"
      @headerRightPane.style.width = "#{rightPaneWidth}px"

      @tableLeftViewport.style.top = "#{@headerHeight}px"
      @tableLeftViewport.style.width = "#{fixedColumnsWidth}px"
      @tableLeftViewport.style.height = "#{paneHeight}px"

      @tableRightViewport.style.top = "#{@headerHeight}px"
      @tableRightViewport.style.left = "#{fixedColumnsWidth}px"
      @tableRightViewport.style.width = "#{rightPaneWidth}px"
      @tableRightViewport.style.height = "#{paneHeight}px"

    _scrollBarWidth: =>
      return @scrollBarWidth if @scrollBarWidth
      div = document.createElement('div')
      div.innerHTML = '<div style="width:50px;height:50px;position:absolute;left:-50px;top:-50px;overflow:auto;"><div style="width:1px;height:100px;"></div></div>'
      div = div.firstChild
      document.body.appendChild(div)
      width = div.offsetWidth - div.clientWidth
      document.body.removeChild(div)
      @scrollBarWidth = width

    _elWidth: (obj) ->
      Math.max obj.clientWidth, obj.offsetWidth, obj.scrollWidth
