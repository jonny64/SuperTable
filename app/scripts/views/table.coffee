define ['underscore', 'backbone', 'views/page'], (_, Backbone, PageView) ->
  class TableView extends Backbone.View
    el: '@table-container'
    initialize: ->
      @tableInfo =
        currentRow: 0
        fixHeader: true
        fixColumns: 2
        columnWidth: 120
        borderWidth: 1
        rowHeight: 20
        width: 0
        height: 0
      @listenTo @model, 'change:header change:data', @render
        
    render: ->
      @_assignRegions()
      if @model.get('header')
        @_renderContainer()
        if @$el.width() and @$el.height()
          @_setPanesSize()
      @

    onShow: ->
      if @model.get('header')
        @_setPanesSize()
      else
        @$el.spin()

    _onScroll: (e) =>
      return unless @tableRightViewport
      scrollLeft = @tableRightViewport.scrollLeft
      scrollTop = @tableRightViewport.scrollTop
      
      @headerRightPane.scrollLeft = scrollLeft
      @tableLeftViewport.scrollTop = scrollTop

    _assignRegions: =>
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
      
    _renderContainer: =>
      headContent = @model.get('header')
      bodyContent = @model.get('data')

      @headerLeftColumns.innerHTML = @_renderTable(@_selectCols(headContent,
                                                               0,
                                                               @tableInfo.fixColumns),
                                                   @tableInfo)
      @headerRightColumns.innerHTML = @_renderTable(@_selectCols(headContent,
                                                               @tableInfo.fixColumns),
                                                    @tableInfo)
      @tableLeftCanvas.innerHTML = @_renderTable(@_selectCols(bodyContent,
                                                              0,
                                                              @tableInfo.fixColumns),
                                                 @tableInfo)
      @tableRightCanvas.innerHTML = @_renderTable(@_selectCols(bodyContent,
                                                               @tableInfo.fixColumns),
                                                  @tableInfo)
                                                  
      @$tableRightViewport.unbind 'scroll', @_onScroll
      @$tableRightViewport.bind 'scroll', @_onScroll
      
    _setPanesSize: =>
      return unless @tableContainer
      containerWidth = @$el.width()
      containerHeight = @$el.height()
      return unless (@tableInfo.width - containerWidth) + (@tableInfo.height - containerHeight)

      console.log "setting sizes for width: #{containerWidth}, height: #{containerHeight}"
      @$('.st-table-header-column').css height: @tableInfo.headerHeight
      @tableInfo.width = containerWidth
      @tableInfo.height = containerHeight
      headerHeight = @_elHeight @headerRightColumns
      fixedColumnsWidth = @_elWidth @tableLeftCanvas
      rightCanvasWidth = @_elWidth @tableRightCanvas

      scrollWidth = 25 #calculate
                                  
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

    _buildTemplateTable: (table) ->
      tableWidth = @_tableWidth(table)
      tableHeight = @_tableHeight(table)
      template = ((false for i in [1..tableWidth]) for j in [1..tableHeight])
      marker = 1
      _(table).each (row, rowNum) ->
        _(row.data).each (cell) ->
          r = parseInt(rowNum, 10) - 1
          firstTDIndex = template[r].indexOf(false)
          if firstTDIndex >= 0
            template[r][firstTDIndex] = {cell: cell}
            for i in [0..((parseInt(cell.rowspan, 10) || 1) - 1)]
              for j in [0..((parseInt(cell.colspan, 10) || 1) - 1)]
                template[r + i][firstTDIndex + j] ||= {}
                template[r + i][firstTDIndex + j].marker = marker
            marker = marker + 1
      template

    _renderTable: (table, tableInfo, topTable=true) =>
      return unless _.isObject(table)
      html = []
      if topTable
        html.push "<tr class=\"st-table-width-row\"><th class=\"st-table-row-holder\"></td>"
        html.push("<th class=\"st-table-column-holder\"></td>") for i in [1..@_tableWidth(table)]
        html.push "</tr>"
      _(table)
        .chain()
        .sort()
        .toArray()
        .each((row) =>
          options =
            style: "height:#{row.height || tableInfo.rowHeight}px;"
          html.push "<tr #{@_tagAttributes(_.extend(options, row))}>"
          html.push "<th class=\"st-table-row-holder\"></td>"
          _(row.data).each((cell) =>
            options =
              class: _.compact([cell.class, "st-table-cell"]).join(" ")
            html.push "<td #{@_tagAttributes(_.extend({}, cell, options))}>"
            html.push cell.content
            html.push "</td>"
          )
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

    _tableWidth: (table) ->
      return unless table['1']
      width = 0
      _(table['1'].data).each (cell) ->
        width = width + (if cell.colspan then parseInt(cell.colspan, 10) else 1)
      width

    _tableHeight: (table) ->
      _(table).size()
        
    _elWidth: (obj) ->
      Math.max obj.clientWidth, obj.offsetWidth, obj.scrollWidth

    _elHeight: (obj) ->
      Math.max obj.clientHeight, obj.offsetHeight, obj.scrollHeight
