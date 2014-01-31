define ['underscore', 'backbone'], (_, Backbone) ->
  class TableModel extends Backbone.Model
    parse: (resp, options) ->
      switch options.fetchType
        when 'table'
          resp
        when 'merge'
          data: _.extend {}, @get('data'), resp.data
        when 'get'
          data: resp.data
        else
          console.log 'unknown fetch type'

    firstRow: ->
      return 0 unless rows = @rows()
      _.min(rows)

    lastRow: ->
      return 0 unless rows = @rows()
      _.max(rows)

    rows: ->
      return false unless (data = @get('data'))
      _(data).chain()
             .keys()
             .map((e) -> parseInt(e, 10))
             .value()
      
    lastPage: =>
      Math.ceil(@lastRow() / @get('tableInfo').rowsOnPage)

    firstPage: =>
      Math.ceil(@firstRow() / @get('tableInfo').rowsOnPage)

    totalPages: =>
      tableInfo = @get('tableInfo')
      return 0 unless tableInfo and tableInfo.totalRows and tableInfo.rowsOnPage
      Math.floor tableInfo.totalRows / tableInfo.rowsOnPage
