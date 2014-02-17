define ['underscore', 'jquery'], (_, $) ->
  class ResizingGrid
    constructor: (options) ->
      @$container = $(options.container)
      @model = options.model
      @app = options.app
      @currentBlock = null

    setGrid: ->
      holder = @resizeHolder()
      widthCols = {}
      @$container.find('tr .st-table-column-holder').each((ind, el) =>
        right = el.offsetLeft + @app.elWidth(el)
        widthCols[right] = el)
      tds = @$container.find('th, td').filter(':not(.st-table-column-holder)')
      _(tds).each((td) =>
        tdWidth = @app.elWidth(td)
        resizeBlock = @resizeBlock
          left: td.offsetLeft + tdWidth, top: td.offsetTop,
          @app.elHeight(td)
        resizeBlock._resize = {}
        resizeBlock._resize.td = td
        resizeBlock._resize.width = tdWidth
        resizeBlock._resize.cols = @_getWidthColumns(td)
        holder.appendChild resizeBlock )
      @$container[0].appendChild holder

    resizeHolder: =>
      div = document.createElement('div')
      div.className = 'st-resize-container'
      div

    resizeBlock: (pos, height) ->
      resizeDiv = document.createElement('div')
      resizeDiv.className = 'st-resize-block'
      resizeDiv.style.height = "#{height}px"
      resizeDiv.style.left = "#{pos.left}px"
      resizeDiv.style.top = "#{pos.top}px"
      resizeDiv

    _getWidthColumns: (td) =>

    # split given width among num columns
    _splitByColumns: (width, num) ->
      rest = width % num
      base = Math.floor(width / num)
      ((base + (if (i <= rest) then 1 else 0)) for i in [1..num])
