define ['underscore', 'backbone'], (_, Backbone) ->
  class TableState
    constructor: (options) ->
      {@app, @el, @table} = options

    columns: =>
      leftHeader = @el.querySelector('.st-table-header-left-pane table.st-fixed-table-left')
      rightHeader = @el.querySelector('.st-table-header-right-pane table.st-fixed-table-right')

      [].concat(@_collectHeaderData(leftHeader))
        .concat(@_collectHeaderData(rightHeader))

    _collectHeaderData: (header) =>
      tds = header.querySelectorAll('th[id], td[id]')
      w = _(tds).map (td) ->
        { el: td, left: td.offsetLeft, right: td.offsetLeft + td.offsetWidth }
      @_gatherData(w)

    _gatherData: (tds, arr=[]) =>
      return arr unless tds.length
      [first] = tds.splice(0, 1)
      obj = @_tdAttrs(first.el)
      isChild = _.partial(@_isChild, first)
      children = _(tds).filter(isChild)
      other    = _(tds).reject(isChild)
      if children.length
        obj.group = @_gatherData(children, [])
      arr.push obj
      @_gatherData(other, arr)

    _isChild: (parent, child) ->
      child.left >= parent.left and child.right <= parent.right

    _tdAttrs: (td) ->
      sort = {}
      if td.className.match(/\bsortable\b/)
        sort.sort = '1'
        if td.querySelector('div.st-sort-block span[data-order-dir="asc"]').className == 'active'
          sort.asc = '1'
        else if td.querySelector('div.st-sort-block span[data-order-dir="desc"]').className == 'active'
          sort.desc = '1'
          
      _.extend {
        id: td.id,
        width: td.clientWidth,
        height: td.clientHeight
        }, sort
