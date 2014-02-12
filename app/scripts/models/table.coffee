define ['underscore', 'backbone'], (_, Backbone) ->
  class TableModel extends Backbone.Model
    parse: (resp, options) ->
      if @get('fetchType') == 'mergePage'
        resp.start = '' + @start()
        resp.portion = '' + (@portion() + parseInt(resp.portion, 10))
      resp

    lastPage: =>
      @total() - @portion() <= @start()

    firstPage: =>
      !@start()

    nextPage: =>
      @start() + @portion()

    prevPage: =>
      @start() - @portion()

    start: => parseInt(@get('start'), 10)
    portion: => parseInt(@get('portion'), 10)
    total: => parseInt(@get('total'), 10)

