define ['underscore', 'jquery', 'templates/_resize_bar'], (_, $, template) ->
  class Resizing
    constructor: (options) ->
      @app = options.app
      @onResizeCb = options.onResizeCb
      @tableDefaults = options.tableDefaults
      @$main = options.$main
      @mainHeight = @$main.height()
      @statOverlay = options.statOverlay
      @$main.on 'mousedown', '.st-resize-block', @_onMouseDown
      @$main.on 'mousemove', @_onMouseMove
      @$main.on 'mouseup', @_onMouseUp
      @dragging = false

    rebind: ({@statOverlay}) =>

    _onMouseDown: (e) =>
      @$current = $(e.currentTarget)
      @$current.addClass('dragging')
      @resizeBar = @_resizeBar(e.currentTarget)
      @statOverlay.appendChild @resizeBar.div
      @startDragX = e.clientX
      @origWidth = @$current[0]._resize.width
      @numCols = @$current[0]._resize.colsClasses.length
      @dragging = true
      e.preventDefault()
      e.stopPropagation()

    _onMouseMove: (e) =>
      return unless @dragging
      newLeft = @resizeBar.initLeft - @origWidth + @_newWidth(e)
      @resizeBar.div.style.left = "#{newLeft}px"

    _onMouseUp: (e) =>
      return unless @dragging
      newWidth = @_newWidth(e)
      @app.log "prev width: #{@origWidth} | new width: #{newWidth}"
      @_resizeAction(newWidth, @$current[0])

      @$current.removeClass('dragging')
      @$current = null
      @statOverlay.removeChild @resizeBar.div
      @resizeBar = null
      @startDragX = 0
      @origWidth = 0
      @dragging = false
      @app.cancelSelection() #ie8

    _newWidth: (e) =>
      return 0 unless @dragging
      offset = e.clientX - @startDragX
      _.max [@tableDefaults.columnMinWidth * @numCols, @origWidth + offset]

    _resizeBar: (origin) =>
      bar = document.createElement('div')
      bar.className = 'st-resizing-bar-holder'
      bar.innerHTML = template()
      originRect = origin.getBoundingClientRect()
      staticRect = @statOverlay.getBoundingClientRect()
      top = originRect.top - staticRect.top
      left = originRect.left - staticRect.left
      bar.style.top = "#{top}px"
      bar.style.left = "#{left}px"
      headerBar = bar.querySelector('.st-resizing-bar')
      # ie8 hack
      originHeight = originRect.height || (originRect.bottom - originRect.top)
      headerBar.style.height = "#{originHeight}px"
      dropBar = bar.querySelector('.st-resizing-drop-bar')
      dropBar.style.height = "#{@mainHeight}px"
      { div: bar, initLeft: left }

    _resizeAction: (width, origin) =>
      $tables = @$main.find(".#{origin._resize.tableClass}")
      tableWidth = $tables.eq(0).width()
      diff = width - origin._resize.width
      $tables.each((ind, table) -> table.style.width = "#{tableWidth + diff}px")
      for w, i in @_splitByColumns(width, @numCols)
        tds = @$main[0].querySelectorAll(@_classToQuery(origin._resize.colsClasses[i]))
        td.style.width = "#{w}px" for td in tds
      origin._resize.resizeGrid.setGrid()
      if _.isFunction(@onResizeCb)
        @onResizeCb.call(null, origin._resize.tableClass)

    _classToQuery: (str) ->
      ".#{str}".split(' ').join('.')

    # split given width among num columns
    _splitByColumns: (width, num) ->
      rest = width % num
      base = Math.floor(width / num)
      ((base + (if (i <= rest) then 1 else 0)) for i in [1..num])
