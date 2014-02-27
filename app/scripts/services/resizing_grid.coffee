define ['underscore', 'jquery'], (_, $) ->
  class ResizingGrid
    constructor: (options) ->
      @$container = $(options.container)
      @model = options.model
      @app = options.app
      @currentBlock = null
      @holder = null

    setGrid: ->
      container = @$container[0]
      if container.contains(@holder)
        container.removeChild @holder
      @holder = @resizeHolder()
      @widthCols = {}
      table = container.querySelector('table')
      @$container.find('tr .st-table-column-holder').each((ind, el) =>
        right = el.offsetLeft + @app.elWidth(el)
        @widthCols[right] = el)
      @widthColsKeys = _.keys(@widthCols)
      tds = @$container.find('th, td').filter(':not(.st-table-column-holder)')
      _(tds).each((td) =>
        left = td.offsetLeft + td.clientWidth
        resizeBlock = @resizeBlock
          left: left, top: td.offsetTop,
          @app.elHeight(td)
        resizeBlock._resize = {}
        resizeBlock._resize.resizeGrid = @
        resizeBlock._resize.tableClass = table.className
        resizeBlock._resize.tdClass = td.className
        resizeBlock._resize.width = td.clientWidth
        resizeBlock._resize.colsClasses = @_getWidthColumns(td)
        @holder.appendChild resizeBlock )
      container.appendChild @holder

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
      offset = td.offsetLeft
      width = @app.elWidth(td)
      (@widthCols[key].className for key in  _.filter(@widthColsKeys, ((el) ->
        offset < parseInt(el, 10) <= offset + width)))
