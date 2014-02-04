define ['underscore', 'backbone', 'views/page'], (_, Backbone, PageView) ->
  class TableView extends Backbone.View
    el: '@table-container'
    initialize: ->
      @tableInfo =
        fixHeader: true
        fixColumns: 2
        columnWidth: 120
        borderWidth: 1
        rowHeight: 20
        width: 0
        height: 0
        rowsOnPage: 52
        totalRows: 156

      @model.set 'tableInfo', @tableInfo
      @listenTo @options.app, 'page:loading', => @$el.spin()
      @listenTo @model, 'change:data', (model, val) =>
        @_dataRendered = false
        @_headerRendered = false if 'header' in model.changed
        @_renderContainer(model.get('header'), model.get('data'))

      @prevScrollTop = 0
      @prevScrollLeft = 0
      @_headerRendered = false
      @_dataRendered = false
      
      @_hitBottom = false
        
    render: ->
      console.log 'render'
      @_assignRegions()
      @_renderContainer(@model.get('header'), @model.get('data'))
      @

    onShow: ->
      if @_headerRendered and @_dataRendered
        @_setPanesSize()
        @_removeSpinner()
      else
        @$el.spin()

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

        if (scrollTop + @tableRightViewport.clientHeight) >= @_elHeight(@tableRightViewport)
          @options.app.trigger 'scroll:bottom'
          @_hitBottom = true
        else if @_hitBottom
          @options.app.trigger 'scroll'
          @_hitBottom = false

    _assignRegions: =>
      @tableContainer = @$('.st-table-container')[0]
      @$tableRightViewport = @$('.st-table-right-viewport')
      @tableRightViewport = @$tableRightViewport[0]
      @tableLeftViewport = @$('.st-table-left-viewport')[0]
      @headerRightColumns = @$('.st-table-header-right-columns')[0]
      @headerLeftColumns = @$('.st-table-header-left-columns')[0]
      @headerRightPane = @$('.st-table-header-right-pane')[0]
      @headerLeftPane = @$('.st-table-header-left-pane')[0]
      @$tablePre = @$('table.st-table-pre-render')
      @tableRightCanvas = @$('.st-table-right-canvas')[0]
      @tableLeftCanvas = @$('.st-table-left-canvas')[0]

    _calcHeader: (header, data) =>
      return false unless header and data
      console.log 'calc header'
      @tableInfo.widths = @_countWidths(header, data)
      leftWidths = @tableInfo.widths.slice(0, @tableInfo.fixColumns)
      rightWidths = @tableInfo.widths.slice(@tableInfo.fixColumns) 

      left: @_renderTable(
        @_selectCols(header, 0, @tableInfo.fixColumns),
        @tableInfo,
        leftWidths)
      right: @_renderTable(
        @_selectCols(header, @tableInfo.fixColumns),
        @tableInfo,
        rightWidths,
        true)

    _calcData: (data) =>
      return false unless @tableInfo.widths and data
      console.log 'calc data'
      leftWidths = @tableInfo.widths.slice(0, @tableInfo.fixColumns)
      rightWidths = @tableInfo.widths.slice(@tableInfo.fixColumns)
      
      left: @_renderTable(
        @_selectCols(data, 0, @tableInfo.fixColumns),
        @tableInfo,
        leftWidths)
      right: @_renderTable(
        @_selectCols(data, @tableInfo.fixColumns),
        @tableInfo,
        rightWidths)

    _renderContainer: (header, data) =>
      console.log 'render container'
      @_renderHeader(header, data)
      @_renderData(data)

    _renderHeader: (header, data) =>
      return unless @headerRightColumns and !@_headerRendered
      console.log 'try render header'
      renderedHeader = @_calcHeader(header, data)

      if renderedHeader
        console.log 'insert header'
        @headerLeftColumns.innerHTML = renderedHeader.left
        @headerRightColumns.innerHTML = renderedHeader.right

        @_headerRendered = true
        @_setPanesSize()
        @_removeSpinner()

    _renderData: (data) =>
      return unless @tableRightCanvas and !@_dataRendered
      console.log 'try render data'
      renderedData = @_calcData(data)

      if renderedData
        console.log 'insert data'
        @tableLeftCanvas.innerHTML = renderedData.left
        @tableRightCanvas.innerHTML = renderedData.right

        @$tableRightViewport.unbind 'scroll', @_onScroll
        @$tableRightViewport.bind 'scroll', @_onScroll

        @_dataRendered = true
        @_setPanesSize()
        @_removeSpinner()

    _removeSpinner: =>
      @$el.spin(false) if @_headerRendered and @_dataRendered
      
    _setPanesSize: =>
      return unless (@el and @_headerRendered and @_dataRendered)
      console.log 'set panes size'
      containerWidth = @_elWidth(@el)
      containerHeight = @_elHeight(@el)
      return unless (@tableInfo.width - containerWidth) + (@tableInfo.height - containerHeight)

      console.log "setting sizes for width: #{containerWidth}, height: #{containerHeight}"
      @$('.st-table-header-column').css height: @tableInfo.headerHeight
      @tableInfo.width = containerWidth
      @tableInfo.height = containerHeight
      headerHeight = @_elHeight @headerRightColumns
      
      fixedColumnsWidth = _(@tableInfo.widths.slice(0, @tableInfo.fixColumns)).reduce(((memo, el) -> memo + el), 0)
      rightCanvasWidth = _(@tableInfo.widths.slice(@tableInfo.fixColumns)).reduce(((memo, el) -> memo + el), 0)

      scrollWidth = @_scrollBarWidth()
      borderWidth = @tableInfo.borderWidth
                                  
      rightPaneWidth = _.min([containerWidth - fixedColumnsWidth, rightCanvasWidth + scrollWidth])
      paneHeight = containerHeight - headerHeight

      @tableContainer.style.width = "#{containerWidth}px"
      @tableContainer.style.height = "#{containerHeight}px"

      @headerLeftPane.style.width = "#{fixedColumnsWidth}px"
      @headerRightPane.style.left = "#{fixedColumnsWidth}px"
      @headerRightPane.style.width = "#{rightPaneWidth}px"

      @tableLeftViewport.style.top = "#{headerHeight}px"
      @tableLeftViewport.style.width = "#{fixedColumnsWidth}px"
      @tableLeftViewport.style.height = "#{paneHeight}px"

      @tableRightViewport.style.top = "#{headerHeight}px"
      @tableRightViewport.style.left = "#{fixedColumnsWidth}px"
      @tableRightViewport.style.width = "#{rightPaneWidth}px"
      @tableRightViewport.style.height = "#{paneHeight}px"

      @headerLeftColumns.style.width = @tableLeftCanvas.style.width = "#{fixedColumnsWidth}px"
      @headerRightColumns.style.width = "#{rightCanvasWidth + scrollWidth + borderWidth}px"
      @tableRightCanvas.style.width = "#{rightCanvasWidth}px"
      
    _selectCols: (table, start, num) =>
      template = @_buildTemplateTable(table)
      num = template[0].length - start unless num
      # check if it's possible to select columns (colspan check)
      # left edge
      if start > 0
        unless _(template)
          .chain()
          .map((e) -> e.slice(start - 1, start + 1)) # slice previous and
                                             # first columns
          .map((e) -> e[0].marker != e[1].marker) # they should be different
          .every()                           # all of them
          .value() then return alert("невозможно выделить пересекающиеся колонки")
          
      #right edge
      if ((start + num) < template[0].length)
        unless _(template)
          .chain()
          .map((e) -> e.slice(start + num - 1, start + num + 1))
          .map((e) -> e[0].marker != e[1].marker)
          .every()
          .value() then return alert("невозможно выделить пересекающиеся колонки")

      _(template)
        .chain()
        .map((e) -> e.slice(start, start + num))
        .map((e, index) -> [index + 1, data: _(e)
                                               .chain()
                                               .filter((cell) -> cell.cell)
                                               .map((e) -> e.cell)
                                               .value()])
        .object()
        .value()
        
    _selectRows: (table, start, num) =>

    _templateCache: {}
    
    _buildTemplateTable: (table) ->
      key = JSON.stringify(table)
      if @_templateCache[key]
        console.log 'hit template cache'
        return @_templateCache[key]
      console.log 'build template table'
      tableWidth = @_tableWidth(table)
      tableHeight = @_tableHeight(table)
      template = ((false for i in [1..tableWidth]) for j in [1..tableHeight])
      marker = 1
      _(table).chain().sort().toArray().each (row, r) ->
        _(row.data).each (cell) ->
          firstTDIndex = template[r].indexOf(false)
          if firstTDIndex >= 0
            template[r][firstTDIndex] = {cell: cell}
            for i in [0..((parseInt(cell.rowspan, 10) || 1) - 1)]
              for j in [0..((parseInt(cell.colspan, 10) || 1) - 1)]
                template[r + i][firstTDIndex + j] ||= {}
                template[r + i][firstTDIndex + j].marker = marker
            marker = marker + 1
      @_templateCache[key] = template
      template

    _renderTable: (table, tableInfo, widths, scrollHolder=false) =>
      return unless _.isObject(table)
      console.log 'render table'
      html = []
      if widths
        html.push "<tr class=\"st-table-width-row\"><th class=\"st-table-row-holder\"></td>"
        for width in widths
          style = if width then " style=\"width: #{width}px;\"" else ""
          html.push("<th class=\"st-table-column-holder\"#{style}></th>")
        html.push("<th class=\"scrollbar-place\" style=\"max-width: #{@_scrollBarWidth() + tableInfo.borderWidth}px;\"></th>") if scrollHolder
        html.push "</tr>"
      _(table)
        .chain()
        .sort()
        .toArray()
        .each((row) =>
          options =
            style: "height:#{row.height || tableInfo.rowHeight}px;"
          html.push "<tr #{@_tagAttributes(_.extend(options, row))}>"
          html.push "<th class=\"st-table-row-holder\"></th>"
          _(row.data).each((cell) =>
            options =
              class: _.compact([cell.class, "st-table-cell"]).join(" ")
            html.push "<td #{@_tagAttributes(_.extend({}, cell, options))}>"
            html.push cell.content
            html.push "</td>"
          )
          html.push("<td class=\"scrollbar-place\"></td>") if scrollHolder
          html.push "</tr>"
        )

      html.join("")

    _tagAttributes: (data) ->
      _(data)
        .chain()
        .map((val, key) ->
          "#{key}=\"#{val}\"" unless key in ['data', 'content'])
        .compact()
        .value()
        .join(" ")

    _firstRow: (table) ->
      minIndex = _(table).chain()
              .keys()
              .map((k) -> parseInt(k, 10))
              .min()
              .value()
      table[minIndex]
      
    _tableWidth: (table) =>
      return unless _.isObject(table)
      width = 0
      _(@_firstRow(table).data).each (cell) ->
        width = width + (if cell.colspan then parseInt(cell.colspan, 10) else 1)
      width

    _tableHeight: (table) ->
      _(table).size()
        
    _elWidth: (obj) ->
      Math.max obj.clientWidth, obj.offsetWidth, obj.scrollWidth

    _elHeight: (obj) ->
      Math.max obj.clientHeight, obj.offsetHeight, obj.scrollHeight

    _countWidths: (head, body) =>
      console.log 'count width'
      widths = (120 for i in [1..@_tableWidth(head)])
      ###
      if head
        @$tablePre.html @_renderTable(head, @tableInfo, widths)
      @$tablePre.append @_renderTable(body, @tableInfo)

      @$tablePre
        .find('tr.st-table-width-row')
        .eq(0)
        .find('th.st-table-column-holder')
        .map((i, e) => @_elWidth(e))
      ###

    _scrollBarWidth: =>
      return @scrollBarWidth if @scrollBarWidth
      div = document.createElement('div')
      div.innerHTML = '<div style="width:50px;height:50px;position:absolute;left:-50px;top:-50px;overflow:auto;"><div style="width:1px;height:100px;"></div></div>'
      div = div.firstChild
      document.body.appendChild(div)
      width = div.offsetWidth - div.clientWidth
      document.body.removeChild(div)
      @scrollBarWidth = width
