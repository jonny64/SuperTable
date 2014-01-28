define ['underscore', 'backbone', 'views/page'], (_, Backbone, PageView) ->
  class TableView extends Backbone.View
    el: '@table-container'
    initialize: ->
      @tableInfo =
        currentRow: 0
        fixHeader: true
        fixColumns: 2
        allColumns: 0
        columnWidth: 120
        headerHeight: 20
        width: 0
        height: 0
      @listenTo @model, 'change:head change:body', @render
        
    render: ->
      @tableInfo.allColumns = @model.get('head')?.length
      if @model.get('head')
        @_countWidths()
        @_renderTable()
        if @$el.width() and @$el.height()
          @_setPanesSize()
      @

    onShow: ->
      if @model.get('head')
        @_setPanesSize()
      else
        @$el.spin()

    _onScroll: (e) =>
      return unless @tableRightViewport
      scrollLeft = @tableRightViewport.scrollLeft
      scrollTop = @tableRightViewport.scrollTop
      
      @headerRightPane.scrollLeft = scrollLeft
      @tableLeftViewport.scrollTop = scrollTop
      
    _renderTable: =>
      headContent = @model.get('head')
      bodyContent = @model.get('body')
      
      @tableContainer = @$('.st-table-container')[0]
      @$tableRightViewport = @$('.st-table-right-viewport')
      @tableRightViewport = @$tableRightViewport[0]
      @tableLeftViewport = @$('.st-table-left-viewport')[0]
      @tableRightCanvas = @$('.st-table-right-canvas')[0]
      @tableLeftCanvas = @$('.st-table-left-canvas')[0]
      @headerRightColumns = @$('.st-table-header-right-columns')[0]
      @headerLeftColumns = @$('.st-table-header-left-columns')[0]
      @headerRightPane = @$('.st-table-header-right-pane')[0]
      @headerLeftPane = @$('.st-table-header-left-pane')[0]

      @headerLeftColumns.innerHTML = @_renderHeaderRow(@_fixedCols(headContent))
      @headerRightColumns.innerHTML = @_renderHeaderRow(@_restCols(headContent))

      @tableLeftCanvas.innerHTML = (@_renderTableRow(@_fixedCols(row)) for row in bodyContent).join('')
      @tableRightCanvas.innerHTML = (@_renderTableRow(@_restCols(row)) for row in bodyContent).join('')

      @$tableRightViewport.unbind 'scroll', @_onScroll
      @$tableRightViewport.bind 'scroll', @_onScroll
      
    _setPanesSize: =>
      return unless @tableContainer and @tableInfo.allColumns
      containerWidth = @$el.width()
      containerHeight = @$el.height()
      return unless (@tableInfo.width - containerWidth) + (@tableInfo.height - containerHeight)

      console.log "setting sizes for width: #{containerWidth}, height: #{containerHeight}"
      @$('.st-table-header-column').css height: @tableInfo.headerHeight
      @tableInfo.width = containerWidth
      @tableInfo.height = containerHeight
      allColumnsWidth = @_calcWidth(0, @tableInfo.allColumns)
      fixedColumnsWidth = @_calcWidth(0, @tableInfo.fixColumns)

      rightCanvasWidth = allColumnsWidth - fixedColumnsWidth
      rightPaneWidth = _.min([containerWidth - fixedColumnsWidth, rightCanvasWidth + 25])
      paneHeight = containerHeight - @tableInfo.headerHeight

      @tableContainer.style.width = "#{containerWidth}px"
      @tableContainer.style.height = "#{containerHeight}px"

      @headerLeftPane.style.width = "#{fixedColumnsWidth}px"
      @headerRightPane.style.left = "#{fixedColumnsWidth}px"
      @headerRightPane.style.width = "#{rightPaneWidth}px"

      @headerLeftColumns.style.width = "#{fixedColumnsWidth}px"
      @headerRightColumns.style.width = "#{rightCanvasWidth + 25}px"

      @tableLeftViewport.style.top = "#{@tableInfo.headerHeight}px"
      @tableLeftViewport.style.width = "#{fixedColumnsWidth}px"
      @tableLeftViewport.style.height = "#{paneHeight}px"

      @tableRightViewport.style.top = "#{@tableInfo.headerHeight}px"
      @tableRightViewport.style.left = "#{fixedColumnsWidth}px"
      @tableRightViewport.style.width = "#{rightPaneWidth}px"
      @tableRightViewport.style.height = "#{paneHeight}px"
      
      @tableLeftCanvas.style.width = "#{fixedColumnsWidth}px"
      @tableRightCanvas.style.width = "#{rightCanvasWidth}px"

    _fixedCols: (row) =>
      row.slice(0, @tableInfo.fixColumns)

    _restCols: (row) =>
      row.slice(@tableInfo.fixColumns)
      
    _renderHeaderRow: (row) =>
      out = ("<div class=\"st-table-header-column\" style=\"width: #{col.width}px;\">#{col.content}</div>" for col in row)
      out.join("")
      
    _renderTableRow: (row) =>
      out = ["<div class=\"st-table-row\">"]
      out.push("<div class=\"st-table-cell\" style=\"width: #{cell.width}px;\">#{cell.content}</div>") for cell in row
      out.push("</div>")
      out.join("")

    _calcWidth: (start, end) =>
      return 0 unless @widths
      end ?= start + 1
      out = 0
      out = out + width for width in @widths.slice(start, end)
      out

    _countWidths: =>
      @widths = (col.width for col in @model.get('head'))
      bodyContent = @model.get('body')
      for row in bodyContent
        for cell, index in row
          cell.width = @widths[index]
