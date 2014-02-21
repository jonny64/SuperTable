define ['underscore', 'jquery'], (_, $) ->
  class ColumnReordering
    constructor: (options) ->
      @dragConfig =
        threshold: 10

      @app = options.app
      @el = options.container
      @$el = $(@el)

      @$el.on 'mousedown', 'th', @_onMouseDown
      @$el.on 'mousemove', @_onMouseMove
      @$el.on 'mouseup', @_onMouseUp

    _onMouseDown: (e) =>
      return if @dragEvent
      @initState =
        x: e.clientX
        y: e.clientY
        el: e.currentTarget

    _onMouseMove: (e) =>
      return unless @initState or @dragEvent
      if @dragEvent
        @_setDivPos(e, @dragEvent)
      else if (Math.abs(@initState.x - e.clientX) > @dragConfig.threshold or
              Math.abs(@initState.y - e.clientY) > @dragConfig.threshold)
         @app.cancelSelection()
         el = @initState.el
         @dragEvent =
           initState: @initState
           oldPos:
             left: el.offsetLeft
             top: el.offsetTop
           boundaries: @_getBoundaries(el)
           elWidth: el.offsetWidth
           initElBgColor: el.style.backgroundColor
           dragDiv: @_dragDiv(@initState)
         @_setDivPos(e, @dragEvent)
         @el.appendChild @dragEvent.dragDiv

    _onMouseUp: (e) =>
      return unless @dragEvent
      @el.removeChild @dragEvent.dragDiv
      @app.cancelSelection()
      @dragEvent = null
      @initState = null

    _dragDiv: (initState, pos) ->
      el = initState.el
      rect = el._reorder.boundingRect
      div = document.createElement('div')
      div.className = 'st-drag-div'
      div.style.width = "#{rect.right - rect.left}px"
      div.style.height = "#{rect.bottom - rect.top}px"
      div

    _setDivPos: (e, dragEvent) ->
      pos = @_divPos(e, dragEvent)
      dragEvent.dragDiv.style.top = "#{pos.y}px"
      dragEvent.dragDiv.style.left = "#{pos.x}px"

    _divPos: (e, dragEvent) ->
      x = dragEvent.oldPos.left + (e.clientX - dragEvent.initState.x)

      y: dragEvent.oldPos.top
      x: _.min([_.max([x, dragEvent.boundaries.left]),
                dragEvent.boundaries.right - dragEvent.elWidth])

    buildHierarchy: =>
      table = @el.querySelector('table')
      tds = table.querySelectorAll('th, td:not(.st-table-column-holder)')
      # count positions/widths
      w = _(tds).map (td) ->
        td._reorder = null
        { el: td, left: td.offsetLeft, right: td.offsetLeft + td.offsetWidth }
      # build hierarchy
      _(w).each (tdi) ->
        tdi.el._reorder ||= { children: [], parents: [] }
        _(w).each (tdj) ->
          if tdi != tdj and tdi.left <= tdj.left and tdi.right >= tdj.right
            tdj.el._reorder ||= { children: [], parents: [] }
            tdi.el._reorder.children.push tdj.el
            tdj.el._reorder.parents.push tdi.el
      # detect nearest parent
      _(tds).each (td) ->
        minWidth = +Infinity
        nearestParent = null
        _(td._reorder.parents).each (parent) ->
          if parent.offsetWidth < minWidth
            minWidth = parent.offsetWidth
            nearestParent = parent
        td._reorder.nearestParent = nearestParent
      # count group rect
      _(tds).each (td) =>
        rect = @_getRect(td)
        _(td._reorder.children).each (child) =>
          rect = @_calcRect(rect, @_getRect(child))
        td._reorder.boundingRect = rect

    _getRect: (el) ->
      top: el.offsetTop
      left: el.offsetLeft
      right: el.offsetLeft + el.offsetWidth
      bottom: el.offsetTop + el.offsetHeight

    _calcRect: (rect1, rect2) ->
      top: _.min([rect1.top, rect2.top])
      left: _.min([rect1.left, rect2.left])
      right: _.max([rect1.right, rect2.right])
      bottom: _.max([rect1.bottom, rect2.bottom])

    _getBoundaries: (el) =>
      parent = el._reorder.nearestParent || @el.querySelector('table')
      left: parent.offsetLeft
      right: parent.offsetLeft + parent.offsetWidth
