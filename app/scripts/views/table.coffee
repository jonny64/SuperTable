define [
  'underscore',
  'jquery',
  'backbone',
  'services/split_table',
  'services/sorting',
  'services/resizing_grid',
  'services/resizing',
  'services/column_reordering',
  'templates/main_table',
  'templates/empty_table',
  'templates/_sort_block'
  ], (
  _,
  $,
  Backbone,
  SplitTable,
  Sorting,
  ResizingGrid,
  Resizing,
  ColumnReordering,
  mainTableTemplate,
  emptyTableTemplate,
  sortTemplate ) ->
  class TableView extends Backbone.View
    events:
      'click [data-href]': '_onClickDataHref'

    _onClickDataHref: (e) ->
      e.stopPropagation()
      el = e.currentTarget
      data = el.getAttribute 'data-href'
      if parseData = data.match /^javascript:(.*)/m
        [prefix, jscode] = parseData
        eval(jscode)
      else
        window.location.href = data

    initialize: ->
      @tableDefaults =
        columnWidth: 120
        columnMinWidth: 40
        borderWidth: 1
        rowHeight: 28
        width: 0
        height: 0
        extraWidth: 0 # to be able to widen last column
        scrollBarWidth: null
        min_height: 100

      @app = @options.app
      @log = @app.log
      @listenTo @options.app, 'page:loading', @_startSpinner
      @listenTo @options.app, 'page:loaded', @_stopSpinner
      @listenTo @model, 'change', (model) =>
        @render() if model.changed.data

      @prevScrollTop = 0
      @prevScrollLeft = 0
      @_tableRendered = false
      @_regionsAssigned = false
      @_hitBottom = false

      debounceSize = _.debounce((=>
        return unless @tableContainer
        @tableContainer.style.width = '0px'
        @tableContainer.style.height = '0px'
        @$el.width(0)
        @$el.height(0)
        document.body.style.overflow = 'auto'
        @_setPanesSize()), 300)
      $(window).on 'resize', (=> document.body.style.overflow = 'hidden')
      $(window).on 'resize', debounceSize

    render: ->
      @log 'render'
      @_scrollBarWidth()

      html = @model.get('data')
      unless @_regionsAssigned
        @$el.html mainTableTemplate()
        @_assignRegions()
      @_renderContainer(html) if html
      @

    insertSortBlocks: (container) ->
      tds = container.querySelectorAll('td.sortable, th.sortable')
      _(tds).each (td) ->
        td.style.whiteSpace = 'nowrap'
        $(td).append(sortTemplate())

    onShow: ->
      if @_tableRendered
        @_setPanesSize()
        @_stopSpinner()
      else
        @$el.spin()

    _assignRegions: =>
      return if @_regionsAssigned

      @$tableContainer = @$('.st-table-container')
      @tableContainer = @$tableContainer[0]
      @staticOverlay = @tableContainer.querySelector('.st-overlay-container')
      @tableRightViewport = @tableContainer.querySelector('.st-table-right-viewport')
      @tableLeftViewport = @tableContainer.querySelector('.st-table-left-viewport')
      @headerRightPane = @tableContainer.querySelector('.st-table-header-right-pane')
      @headerLeftPane = @tableContainer.querySelector('.st-table-header-left-pane')
      @leftExts = @_assignExtensions(@headerLeftPane)
      @rightExts = @_assignExtensions(@headerRightPane)
      if @resizer
        @resizer.rebind(statOverlay: @staticOverlay)
      else
        @resizer = new Resizing(
          app: @app,
          "$main": @$el,
          onResizeCb: @_resizeCb,
          statOverlay: @staticOverlay,
          tableDefaults: @tableDefaults)
      @_regionsAssigned = true

    _resizeCb: (tableClass) =>
      if tableClass == 'st-fixed-table-left'
        @_setPanesSize()
        @leftExts.reorder.buildHierarchy()
      else if tableClass == 'st-fixed-table-right'
        tables = @tableContainer.querySelectorAll('.st-fixed-table-right')
        for table in tables
          extraWidth = @tableDefaults.extraWidth +
            if (_width = table.getAttribute('data-scroll-width')) then parseInt(_width, 10) else 0
          div = table.parentElement
          div.style.width = "#{@app.elWidth(table) + extraWidth}px"
        @rightExts.reorder.buildHierarchy()
      @app.trigger 'table:widths'

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

      tables = new SplitTable(@el, data, @tableDefaults, @model, @insertSortBlocks)
      @_numerateRows(tables.top.left)
      @_numerateRows(tables.top.right)

      @log 'insert header'
      if tables.top.left
        @headerLeftPane.innerHTML = ''
        @headerLeftPane.appendChild tables.top.left
        @headerLeftColumns = @headerLeftPane.querySelector('table')
        @leftExts.reset()

      if tables.top.right
        @headerRightPane.innerHTML = ''
        @headerRightPane.appendChild tables.top.right if tables.top.right
        @headerRightColumns = @headerRightPane.querySelector('table')
        @headerHeight = tables.top.height
        @rightExts.reset()

      @log 'insert data'
      if @model.get('fetchType') == 'page'
        @tableLeftViewport.innerHTML = ''
        @tableRightViewport.innerHTML = ''
      @tableLeftViewport.appendChild tables.bottom.left
      @tableRightViewport.appendChild tables.bottom.right

      @tableRightViewport.onscroll = @_onScroll
      $(@tableLeftViewport).off('mousewheel')
      $(@tableLeftViewport).on('mousewheel', (e) =>
        @tableRightViewport.scrollTop -= (e.deltaY * e.deltaFactor) if e.deltaY
        @_onScroll())

      @_tableRendered = true
      @_tables = tables
      @_setPanesSize()
      @_stopSpinner()

    _numerateRows: (table, offset=0) ->
      trs = table?.querySelectorAll('tr')
      _(trs).each (tr, ind) ->
        tr.setAttribute 'data-row-index', ind + offset

    _assignExtensions: (container) =>
      options = { app: @options.app, model: @model, container: container }
      sort: new Sorting options
      resize: new ResizingGrid options
      reorder: new ColumnReordering options, @tableRightViewport
      reset: () ->
        @sort.setSorting()
        @resize.setGrid()
        @reorder.buildHierarchy()

    _stopSpinner: =>
      @$el.spin(false)

    _startSpinner: =>
      @$el.spin(true)

    _viewportHeight: =>
      Math.max(document.documentElement.clientHeight, window.innerHeight || 0)

    _getContainerHeight: (tables) =>

      header_height = $(tables.top.right).height()
      body_height = $(tables.bottom.right).height()
      scroll_width = @_scrollBarWidth()
      expanded_table_height = header_height + body_height + scroll_width
      fit_page_height = @_viewportHeight() - @$el.position().top
      fit_page_height -= @$el.css("padding-top").replace("px", "")
      fit_page_height -= @$el.css("padding-bottom").replace("px", "");

      min_height = @tableDefaults.min_height + scroll_width

      return expanded_table_height if expanded_table_height < fit_page_height
      return fit_page_height if fit_page_height > min_height
      return expanded_table_height

    _setPanesSize: =>

      @containerWidth = @$el.width()

      @$el.height(@_getContainerHeight(@_tables))
      @containerHeight = @$el.height()

      @log 'set panes size'
      @log "setting sizes for width: #{@containerWidth}, height: #{@containerHeight}"
      @tableDefaults.width = @containerWidth
      @tableDefaults.height = @containerHeight

      @leftWidth = @app.elWidth(@headerLeftColumns)
      @rightWidth = @app.elWidth(@headerRightColumns)

      scrollWidth = @_scrollBarWidth()
      borderWidth = @tableDefaults.borderWidth

      rightPaneWidth = @containerWidth - @leftWidth #_.min([@containerWidth - @leftWidth, @rightWidth + scrollWidth])
      paneHeight = @containerHeight - @headerHeight

      @tableContainer.style.width = "#{@containerWidth}px"
      @tableContainer.style.height = "#{@containerHeight}px"

      #paneStyle = getComputedStyle(@headerLeftPane,null)
      leftBordersWidth = @headerLeftPane.offsetWidth - @headerLeftPane.clientWidth
      @leftWidth += leftBordersWidth
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
      if !@model.get('fix_columns')
        @tableRightViewport.style.overflowX = "auto"

    _scrollBarWidth: =>
      return @tableDefaults.scrollBarWidth if @tableDefaults.scrollBarWidth != null
      div = document.createElement('div')
      div.innerHTML = '<div style="width:50px;height:50px;position:absolute;left:-50px;top:-50px;overflow:auto;"><div style="width:1px;height:100px;"></div></div>'
      div = div.firstChild
      document.body.appendChild(div)
      width = div.offsetWidth - div.clientWidth
      document.body.removeChild(div)
      @tableDefaults.scrollBarWidth = width
