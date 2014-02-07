define ['underscore', 'backbone'], (_, Backbone) ->
  class TableView extends Backbone.View
    el: '@table-container'
    initialize: ->
      @tableInfo =
        fixHeader: true
        fixColumns: 2
        columnWidth: 120
        borderWidth: 1
        rowHeight: 24
        width: 0
        height: 0
        rowsOnPage: 52
        totalRows: 156
        order: [{"id270":"asc"}]

      @model.set 'tableInfo', @tableInfo
      @log = @options.app.log
      @listenTo @options.app, 'page:loading', @_startSpinner
      @listenTo @options.app, 'page:loaded', @_stopSpinner
      @listenTo @model, 'change:data', (model, val) =>
        frag = @_tableFrag(model.get('data'))
        @_dataRendered = false
        @_headerRendered = false if frag.querySelector('thead')
        @_renderContainer(frag)

      @prevScrollTop = 0
      @prevScrollLeft = 0
      @_headerRendered = false
      @_dataRendered = false

      @_hitBottom = false

    render: ->
      @_scrollBarWidth()
      #console.log 'render'
      @_assignRegions()
      @_assignHandlers()
      @_renderContainer(@_tableFrag(@model.get('data')))
      @

    onShow: ->
      if @_headerRendered and @_dataRendered
        @_setPanesSize()
        @_stopSpinner()
      else
        @$el.spin()

    _tableFrag: (data) =>
      return unless data
      div = document.createElement('div')
      div.innerHTML = data
      table = div.querySelector('table')
      @_insertWidthRulers(table)
      @tablePreRenderer.innerHTML = ''
      @tablePreRenderer.appendChild table
      @tablePreRenderer

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
      @tablePreRenderer = @$('.table-pre-renderer')[0]
      @tableRightViewport = @tableContainer.querySelector(".st-table-right-viewport")
      @tableLeftViewport = @tableContainer.querySelector(".st-table-left-viewport")
      @headerRightPane = @tableContainer.querySelector(".st-table-header-right-pane")
      @headerLeftPane = @tableContainer.querySelector(".st-table-header-left-pane")
      @$tablePre = @$('.st-table-pre-render')

    _assignHandlers: =>
      @$tableContainer.on 'click', '[data-order]', @_onClickSort

    _onClickSort: (e) =>
      #console.log 'sort click'
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

    _renderContainer: (data) =>
      return unless data
      #console.log 'render container'
      @_startSpinner()
      @tableInfo.widths = @_countWidths()
      @_renderHeader(data.querySelector('table > thead'))
      @_renderData(data.querySelector('table > tbody'))
      @_stopSpinner()

    _renderHeader: (thead) =>
      return unless thead and @tableContainer and !@_headerRendered
      #console.log 'try render header'
      renderedHeader = @_splitTable(thead)

      if renderedHeader
        #console.log 'insert header'
        @headerLeftPane.appendChild renderedHeader.left
        @headerRightPane.appendChild renderedHeader.right

        @headerRightColumns = @headerRightPane.firstElementChild
        @headerHeight = renderedHeader.height

        @_setSorting()

        @_headerRendered = true
        @_setPanesSize()

    _renderData: (tbody) =>
      return unless tbody and @tableContainer and !@_dataRendered
      #console.log 'try render data'
      renderedData = @_splitTable(tbody)

      if renderedData
        #console.log 'insert data'
        @tableLeftViewport.appendChild renderedData.left
        @tableRightViewport.appendChild renderedData.right

        @tableRightViewport.onscroll = @_onScroll

        @_dataRendered = true
        @_setPanesSize()

    _stopSpinner: =>
      @$el.spin(false)

    _startSpinner: =>
      @$el.spin(true)

    _setPanesSize: =>
      return unless (@el and @_headerRendered and @_dataRendered)
      #console.log 'set panes size'
      return unless (@tableInfo.width - @containerWidth) + (@tableInfo.height - @containerHeight)

      #console.log "setting sizes for width: #{@containerWidth}, height: #{@containerHeight}"
      @tableInfo.width = @containerWidth
      @tableInfo.height = @containerHeight

      fixedColumnsWidth = _(@tableInfo.widths.left).reduce((sum, n) -> sum += n)
      rightCanvasWidth = _(@tableInfo.widths.right).reduce((sum, n) -> sum += n)

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

    _splitTable: (table) =>
      return unless table
      left = document.createElement('table')
      left.style.tableLayout = 'fixed'
      right = left.cloneNode()
      height = 0
      _(table.querySelectorAll('tr')).each((tr) =>
        trLeft = tr.cloneNode()
        trRight = tr.cloneNode()
        rowHeight = if tr.className == 'st-table-widths-row'
            0
          else
            @tableInfo.rowHeight
        trLeft.style.height = "#{rowHeight}px"
        trRight.style.height = "#{rowHeight}px"
        left.appendChild(trLeft)
        right.appendChild(trRight)
        flag = true
        height = height + rowHeight
        _(tr.querySelectorAll('td, th')).each((td) =>
          if td.className != 'freezbar-cell'
            if flag
              trLeft.appendChild td.cloneNode(true)
            else
              trRight.appendChild td.cloneNode(true)
          else
            flag = false
          ))
      left: left
      right: right
      height: height

    _insertWidthRulers: (table) =>
      tableWidth = 0
      splitAt = 0
      for cell, ind in table.querySelector('thead > tr').querySelectorAll('th, td')
        if cell.className == 'freezbar-cell' then splitAt = ind
        cols = if cell.colSpan then cell.colSpan else 1
        tableWidth = tableWidth + cols
      thead = table.querySelector('thead')
      tbody = table.querySelector('tbody')
      trH = thead.insertRow(0)
      trH.className = 'st-table-widths-row'
      trB = tbody.insertRow(0)
      trB.className = 'st-table-widths-row'
      for i in [0..(tableWidth - 1)]
        className = if i == splitAt
            'freezbar-cell'
          else
            'st-table-column-holder'
        tdH = trH.insertCell(-1)
        tdH.className = className
        tdB = trB.insertCell(-1)
        tdB.className = className
          
    _tableHeight: (data) =>
      data.querySelector('tr').length * @tableInfo.rowHeight

    _elWidth: (obj) ->
      Math.max obj.clientWidth, obj.offsetWidth, obj.scrollWidth

    _elHeight: (obj) ->
      Math.max obj.clientHeight, obj.offsetHeight, obj.scrollHeight

    _countWidths: =>
      #console.log 'count width'
      left = []
      right = []
      flag = true
      for cell in @tablePreRenderer.querySelector('tr.st-table-widths-row').querySelectorAll('td')
        if cell.className != 'freezbar-cell'
          if flag
            left.push @_elWidth(cell)
          else
            right.push @_elWidth(cell)
        else
          flag = false
      {
        left: left
        right: right
      }

    _scrollBarWidth: =>
      return @scrollBarWidth if @scrollBarWidth
      div = document.createElement('div')
      div.innerHTML = '<div style="width:50px;height:50px;position:absolute;left:-50px;top:-50px;overflow:auto;"><div style="width:1px;height:100px;"></div></div>'
      div = div.firstChild
      document.body.appendChild(div)
      width = div.offsetWidth - div.clientWidth
      document.body.removeChild(div)
      @scrollBarWidth = width
