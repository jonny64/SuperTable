define ['underscore', 'backbone'], (_, Backbone) ->
  class TableModel extends Backbone.Model
    parse: (resp, options) ->
      if @get('fetchType') == 'mergePage'
        resp.start = '' + @start()
        resp.cnt = '' + (@cnt() + parseInt(resp.cnt, 10))
      resp

    lastPage: =>
      @total() - @cnt() <= @start()

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

