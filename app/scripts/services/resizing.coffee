define ['underscore', 'jquery', 'templates/_resize_bar'], (_, $, template) ->
  class Resizing
    constructor: (options) ->
      @app = options.app
      @tableDefaults = options.tableDefaults
      @$main = options.$main
      @mainHeight = @$main.height()
      @statOverlay = options.statOverlay
      @$main.on 'mousedown', '.st-resize-block', @_onMouseDown
      @$main.on 'mousemove', @_onMouseMove
      @$main.on 'mouseup', @_onMouseUp
      @dragging = false

    _onMouseDown: (e) =>
      @$current = $(e.currentTarget)
      @$current.addClass('dragging')
      @resizeBar = @_resizeBar(e.currentTarget)
      @statOverlay.appendChild @resizeBar.div
      @startDragX = e.clientX
      @origWidth = @$current[0]._resize.width
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
      @_resizeAction(newWidth, @resizeBar.div)

      @$current.removeClass('dragging')
      @$current = null
      @statOverlay.removeChild @resizeBar.div
      @resizeBar = null
      @startDragX = 0
      @origWidth = 0
      @dragging = false

    _newWidth: (e) =>
      return 0 unless @dragging
      offset = e.clientX - @startDragX
      _.max [@tableDefaults.columnMinWidth, @origWidth + offset]

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
      headerBar.style.height = "#{originRect.height}px"
      dropBar = bar.querySelector('.st-resizing-drop-bar')
      dropBar.style.height = "#{@mainHeight}px"
      { div: bar, initLeft: left }

    _resizeAction: (width, origin) ->


    _cancelSelection: ->
      if document.selection
        document.selection.empty()
      else if window.getSelection
        try
          window.getSelection().collapseToStart()
