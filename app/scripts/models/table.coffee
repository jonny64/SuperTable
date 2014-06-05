define ['underscore', 'backbone'], (_, Backbone) ->
  class TableModel extends Backbone.Model
    parse: (resp, options) ->
      if @get('fetchType') == 'mergePage'
        resp.start = '' + @start()
        resp.cnt = '' + (@cnt() + parseInt(resp.cnt, 10))
      resp.order = @extractOrder(resp.columns) if resp.columns
      resp

    extractOrder: (columns, order={}) =>
      return order unless columns.length
      [first] = columns.splice(0, 1)
      if first.sort
        dir = if first.asc == '1'
            'asc'
          else if first.desc == '1'
            'desc'
        order[first.id] = dir if dir
      _.extend(order, @extractOrder(first.group)) if first.group
      @extractOrder(columns, order)

    lastPage: =>
      @total() - @cnt() <= @start()

    lastPageStart: =>
      @total() - @total() % @portion()

    firstPage: =>
      !@start()

    nextPage: =>
      @start() + @portion()

    prevPage: =>
      @start() - @portion()

    start: => parseInt(@get('start'), 10)
    portion: => parseInt(@get('portion'), 10)
    cnt: => parseInt(@get('cnt'), 10)
    total: => parseInt(@get('total'), 10)

