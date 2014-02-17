define [
  'underscore',
  'backbone',
  'services/split_table',
  'services/sorting',
  'services/resizing_grid',
  'services/resizing'
  ], (_, Backbone, SplitTable, Sorting, ResizingGrid, Resizing) ->
  class TableView extends Backbone.View
    el: '@table-container'
    initialize: ->
      @tableDefaults =
        columnWidth: 120
        columnMinWidth: 40
        borderWidth: 1
        rowHeight: 24
        width: 0
        height: 0
        extraWidth: 100 # to be able to widen last column
        scrollBarWidth: null

      @app = @options.app
      @log = @app.log
      @listenTo @options.app, 'page:loading', @_startSpinner
      @listenTo @options.app, 'page:loaded', @_stopSpinner
      @listenTo @model, 'change', (model) =>
        if model.changed.data
          @_renderContainer(model.get('data'))

      @prevScrollTop = 0
      @prevScrollLeft = 0
      @_tableRendered = false
      @_regionsAssigned = false
      @_hitBottom = false

    render: ->
      @log 'render'
      @_scrollBarWidth()
      @_assignRegions() unless @_regionsAssigned
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
      return if @_regionsAssigned
      @containerWidth = @$el.width()
      @containerHeight = @$el.height()

      @$tableContainer = @$('.st-table-container')
      @tableContainer = @$tableContainer[0]
      @staticOverlay = @tableContainer.querySelector('.st-overlay-container')
      @tableRightViewport = @tableContainer.querySelector('.st-table-right-viewport')
      @tableLeftViewport = @tableContainer.querySelector('.st-table-left-viewport')
      @headerRightPane = @tableContainer.querySelector('.st-table-header-right-pane')
      @headerLeftPane = @tableContainer.querySelector('.st-table-header-left-pane')
      @leftExts = @_assignExtensions(@headerLeftPane)
      @rightExts = @_assignExtensions(@headerRightPane)
      @resizer = new Resizing(
        app: @app,
        "$main": @$el,
        statOverlay: @staticOverlay,
        tableDefaults: @tableDefaults) unless @resizer
      @_regionsAssigned = true

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
        @leftWidth = @app.elWidth(@headerLeftColumns)
        @leftExts.reset()

      if tables.top.right
        @headerRightPane.innerHTML = ''
        @headerRightPane.appendChild tables.top.right if tables.top.right
        @headerRightColumns = @headerRightPane.querySelector('table')
        @rightWidth = @app.elWidth(@headerRightColumns)
        @headerHeight = tables.top.height
        @rightExts.reset()

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

    _assignExtensions: (container) =>
      sort: new Sorting(app: @options.app, model: @model, container: container)
      resize: new ResizingGrid
        app: @options.app
        model: @model
        container: container
      reset: ->
        @sort.insertSortBlocks()
        @resize.setGrid()

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

      scrollWidth = @_scrollBarWidth()
      borderWidth = @tableDefaults.borderWidth

      rightPaneWidth = _.min([@containerWidth - @leftWidth, @rightWidth + scrollWidth])
      paneHeight = @containerHeight - @headerHeight

      @tableContainer.style.width = "#{@containerWidth}px"
      @tableContainer.style.height = "#{@containerHeight}px"

      @headerLeftPane.style.width = "#{@leftWidth}px"
      @headerRightPane.style.left = "#{@leftWidth}px"
      @headerRightPane.style.width = "#{rightPaneWidth}px"

      @tableLeftViewport.style.top = "#{@headerHeight}px"
      @tableLeftViewport.style.width = "#{@leftWidth}px"
      @tableLeftViewport.style.height = "#{paneHeight}px"

      @tableRightViewport.style.top = "#{@headerHeight}px"
      @tableRightViewport.style.left = "#{@leftWidth}px"
      @tableRightViewport.style.width = "#{rightPaneWidth}px"
      @tableRightViewport.style.height = "#{paneHeight}px"

    _scrollBarWidth: =>
      return @tableDefaults.scrollBarWidth if @tableDefaults.scrollBarWidth != null
      div = document.createElement('div')
      div.innerHTML = '<div style="width:50px;height:50px;position:absolute;left:-50px;top:-50px;overflow:auto;"><div style="width:1px;height:100px;"></div></div>'
      div = div.firstChild
      document.body.appendChild(div)
      width = div.offsetWidth - div.clientWidth
      document.body.removeChild(div)
      @tableDefaults.scrollBarWidth = width
