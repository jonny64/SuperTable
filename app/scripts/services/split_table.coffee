define ['underscore'], (_) ->
  class SplitTable
    constructor: (tableHtml, tableDefaults, model, before) ->
      @tableDefaults = tableDefaults
      table = @_createTable(tableHtml)
      @model = model
      thead = table.querySelector('thead')
      before(thead) if thead
      unless @model.get('calculated_dimensions')?.headers
        @_insertWidthRulers(table)
        widths = @_countWidths(table)

      @top = @_splitTable(table.querySelector('thead'),
                          widths,
                          tableDefaults.scrollBarWidth)
      @bottom = @_splitTable(table.querySelector('tbody'), widths)

    _createTable: (html) ->
      div = document.createElement('div')
      div.innerHTML = html
      div.querySelector('table')

    _preRender: =>
      div = document.createElement('div')
      div.style.position = 'fixed'
      div.style.top = '-10000px'
      div.style.left = '-10000px'
      div.style.width = '100px'
      div.style.height = '100px'
      div.style.overflow = 'hidden'
      div.className = 'st-table-pre-render'
      body = document.getElementsByTagName('body').item(0)
      body.appendChild(div)
      div

    _splitTable: (table, widths, scrollWidth=0) =>
      height = 0
      widthLeft = 0
      widthRight = 0
      left = null
      right = null
      if table
        left = document.createElement('table')
        left.style.tableLayout = 'fixed'
        left.className = 'st-fixed-table-left'
        right = left.cloneNode()
        right.className = 'st-fixed-table-right'
        rightDiv = document.createElement('div')
        _(table.querySelectorAll('tr')).each((tr) =>
          trLeft = tr.cloneNode()
          trRight = tr.cloneNode()
          rowHeight = if tr.className == 'st-table-widths-row'
              0
            else
              @tableDefaults.rowHeight
          trLeft.style.height = "#{rowHeight}px"
          trRight.style.height = "#{rowHeight}px"
          left.appendChild(trLeft)
          right.appendChild(trRight)
          if @model.get('fix_columns') == 0
            flag = false
          else
            flag = true
          height = height + rowHeight
          ind = 0
          _(tr.querySelectorAll('td, th')).each((td) =>
            if td.className != 'freezbar-cell'
              if tr.className == 'st-table-widths-row' and widths
                width = widths[ind]
                td.style.width = "#{width}px"
                ind = ind + 1
                if flag
                  widthLeft = widthLeft + width
                else
                  widthRight = widthRight + width

              if flag
                trLeft.appendChild td.cloneNode(true)
              else
                trRight.appendChild td.cloneNode(true)
            else
              flag = false
            ))
        left.style.width = "#{widthLeft}px"
        if widthRight != 0
          rightDiv.style.width = "#{widthRight +
                                    scrollWidth +
                                    @tableDefaults.extraWidth}px"
          right.style.width = "#{widthRight}px"
          right.setAttribute 'data-scroll-width', '' + scrollWidth
        rightDiv.appendChild right
      left: left
      right: rightDiv
      height: height

    _insertWidthRulers: (table) =>
      tableWidth = 0
      splitAt = 0
      col = 0
      for cell, ind in table.querySelector('tr').querySelectorAll('th, td')
        if cell.className == 'freezbar-cell' then splitAt = ind
        cols = if cell.colSpan then cell.colSpan else 1
        tableWidth = tableWidth + cols
      thead = table.querySelector('thead')
      tbody = table.querySelector('tbody')
      if thead
        trH = thead.insertRow(0)
        trH.className = 'st-table-widths-row'
      trB = tbody.insertRow(0)
      trB.className = 'st-table-widths-row'
      for i in [0..(tableWidth - 1)]
        className = if i == splitAt
            'freezbar-cell'
          else
            col = col + 1
            "st-table-column-holder st-width-col-#{col}"
        if thead
          tdH = trH.insertCell(-1)
          tdH.className = className
        tdB = trB.insertCell(-1)
        tdB.className = className

    _elWidth: (obj) ->
      Math.max obj.clientWidth, obj.offsetWidth, obj.scrollWidth

    _elHeight: (obj) ->
      Math.max obj.clientHeight, obj.offsetHeight, obj.scrollHeight

    _countWidths: (table) =>
      div = @_preRender()
      div.appendChild table
      result = []
      for cell in table.querySelector('tr.st-table-widths-row').querySelectorAll('td')
        result.push @_elWidth(cell) if cell.className != 'freezbar-cell'
      document.getElementsByTagName('body').item(0).removeChild(div)
      result
