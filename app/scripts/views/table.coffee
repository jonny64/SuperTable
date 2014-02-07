define ['underscore', 'backbone'], (_, Backbone) ->
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
        order: [{"id270":"asc"}]

      @model.set 'tableInfo', @tableInfo
      @listenTo @options.app, 'page:loading', @_startSpinner
      @listenTo @options.app, 'page:loaded', @_stopSpinner
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
      @_scrollBarWidth()
      console.log 'render'
      @_assignRegions()
      @_assignHandlers()
      @_renderContainer(@model.get('header'), @model.get('data'))
      @

    onShow: ->
      if @_headerRendered and @_dataRendered
        @_setPanesSize()
        @_stopSpinner()
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
      @containerWidth = @_elWidth(@el)
      @containerHeight = @_elHeight(@el)
      
      @$tableContainer = @$('.st-table-container')
      @tableContainer = @$tableContainer[0]
      @tableRightViewport = @tableContainer.querySelector(".st-table-right-viewport")
      @tableLeftViewport = @tableContainer.querySelector(".st-table-left-viewport")
      @headerRightPane = @tableContainer.querySelector(".st-table-header-right-pane")
      @headerLeftPane = @tableContainer.querySelector(".st-table-header-left-pane")

    _assignHandlers: =>
      @$tableContainer.on 'click', '[data-order]', @_onClickSort

    _onClickSort: (e) =>
      console.log 'sort click'
      $el = Backbone.$(e.currentTarget)
      orderId = $el.data('order')
      clickedDir = $el.data('order-dir')
      sort = {}
      unless $el.hasClass("active")
        sort[orderId] = clickedDir
      if e.ctrlKey
        # first we remove from order list existing orderId sorting
        @tableInfo.order = _(@tableInfo.order).reject((e) -> e[orderId])
        @tableInfo.order.push(sort) if _.size(sort)
      else
        @tableInfo.order = [sort]
      @_setSorting()
      @options.app.trigger 'sort:click'

    _setSorting: =>
      @$tableContainer.find("span[data-order]")
                      .removeClass("active")
      _(@tableInfo.order).each((e) =>
        pair = _.pairs(e)[0]
        if pair.length
          @$tableContainer.find("span[data-order=\"#{pair[0]}\"][data-order-dir=\"#{pair[1]}\"]").addClass("active"))                

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
      @_startSpinner()
      @_renderHeader(header, data)
      @_renderData(data)
      @_stopSpinner()

    _renderHeader: (header, data) =>
      return unless @tableContainer and !@_headerRendered
      console.log 'try render header'
      renderedHeader = @_calcHeader(header, data)

      if renderedHeader
        console.log 'insert header'
        @headerLeftPane.innerHTML = "<table class=\"st-header-right-columns\" style=\"table-layout: fixed;width: #{renderedHeader.left.width}px;\">#{renderedHeader.left.html}</table>"
        @headerRightPane.innerHTML = "<table class=\"st-header-right-columns\" style=\"table-layout: fixed;width: #{renderedHeader.right.width}px;\">#{renderedHeader.right.html}</table>"

        @headerRightColumns = @headerRightPane.firstElementChild
        @headerHeight = renderedHeader.right.height

        @_setSorting()

        @_headerRendered = true
        @_setPanesSize()

    _renderData: (data) =>
      return unless @tableContainer and !@_dataRendered
      console.log 'try render data'
      renderedData = @_calcData(data)

      if renderedData
        console.log 'insert data'
        @tableLeftViewport.innerHTML = "<table style=\"table-layout: fixed;width: #{renderedData.left.width}px;\">#{renderedData.left.html}</table>"
        @tableRightViewport.innerHTML = "<table style=\"table-layout: fixed; width: #{renderedData.right.width}px;\">#{renderedData.right.html}</table>"

        @tableRightViewport.onscroll = @_onScroll

        @_dataRendered = true
        @_setPanesSize()

    _stopSpinner: =>
      @$el.spin(false)

    _startSpinner: =>
      @$el.spin(true)
      
    _setPanesSize: =>
      return unless (@el and @_headerRendered and @_dataRendered)
      console.log 'set panes size'
      return unless (@tableInfo.width - @containerWidth) + (@tableInfo.height - @containerHeight)

      console.log "setting sizes for width: #{@containerWidth}, height: #{@containerHeight}"
      @tableInfo.width = @containerWidth
      @tableInfo.height = @containerHeight

      fixedColumnsWidth = @_leftCanvasWidth()
      rightCanvasWidth = @_rightCanvasWidth()

      scrollWidth = @_scrollBarWidth()
      borderWidth = @tableInfo.borderWidth
                                  
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

    _rightCanvasWidth: =>
      _(@tableInfo.widths.slice(@tableInfo.fixColumns)).reduce(((memo, el) -> memo + el), 0)

    _leftCanvasWidth: =>
      _(@tableInfo.widths.slice(0, @tableInfo.fixColumns)).reduce(((memo, el) -> memo + el), 0)
      
    _selectCols: (table, start, num) =>
      template = @_buildTemplateTable(table)
      num = template[0].length - start unless num
      ###
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
      ###
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
      totalWidth = 0
      totalHeight = 0
      if widths
        html.push "<tr class=\"st-table-width-row\"><th class=\"st-table-row-holder\"></th>"
        for width in widths
          style = if width then " style=\"width: #{width}px;\"" else ""
          totalWidth = totalWidth + width
          html.push("<th class=\"st-table-column-holder\"#{style}></th>")
        if scrollHolder
          scrollBarWidth = @_scrollBarWidth() + tableInfo.borderWidth
          totalWidth = totalWidth + scrollBarWidth
          html.push("<th class=\"scrollbar-place\" style=\"width: #{scrollBarWidth}px;\"></th>")
        html.push "</tr>"
      _(table)
        .chain()
        .sort()
        .toArray()
        .each((row) =>
          height = parseInt(row.height, 10) || tableInfo.rowHeight
          @_addStyle row, "height: #{height}px;"
          totalHeight = totalHeight + height
          html.push "<tr #{@_tagAttributes(row)}>"
          html.push "<th class=\"st-table-row-holder\"></th>"
          _(row.data).each((cell) => html.push @_renderCell(cell))
          html.push("<td class=\"scrollbar-place\"></td>") if scrollHolder
          html.push "</tr>"
        )
        
      {
        html: html.join("")
        width: totalWidth
        height: totalHeight
      }

    _renderCell: (cell) =>
      out = []
      @_addClass(cell, "st-table-cell")
      out.push "<td #{@_tagAttributes(cell)}>"
      out.push cell.content
      out.push @_renderSortBlock(cell.order) if cell.order
      out.push "</td>"
      out.join("")

    _renderSortBlock: (order) =>
      out = []
      out.push "<div class=\"st-sort-block\">"
      out.push "<span data-order=\"#{order}\" data-order-dir=\"asc\" title=\"сортировать по возрастанию\">&#9652;</span>"
      out.push "<span data-order=\"#{order}\" data-order-dir=\"desc\" title=\"сортировать по убыванию\">&#9662;</span>"
      out.push "</div>"
      out.join("")

    _addClass: (cell, klass) ->
      cell.class = _.compact([cell.class, klass]).join(" ")

    _addStyle: (cell, style) ->
      cell.style = _.compact([cell.style, style]).join("; ")

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
