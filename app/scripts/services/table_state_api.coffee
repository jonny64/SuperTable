define ['underscore', 'backbone'], (_, Backbone) ->
  class TableStateApin
    constructor: (options) ->
      _.extend @, Backbone.Events
      @app = options.app
      @el = options.el
      @model = options.table

      @listenTo @app, 'sync:widths', @_syncWidths

    _syncWidths: =>
      @app.log 'sync:widths'
      leftHeader = @el.querySelector('.st-table-header-left-pane table.st-fixed-table-left')
      rightHeader = @el.querySelector('.st-table-header-right-pane table.st-fixed-table-right')
      data = _.extend({},
                      @_collectWidths(leftHeader),
                      @_collectWidths(rightHeader))
      requestData = { action: 'update_dimensions' }
      requestData[@model.get('id')] = {"header": data}

      @_api requestData

    _api: (options) =>
      Backbone.$.ajax
        method: 'POST'
        url: @model.url
        data: _.extend {"type":"__tables"}, options

    _collectWidths: (table) ->
      out = {}
      tds = table.querySelectorAll('td, th')
      for td in tds when td.id
        out[td.id] = {}
        out[td.id].width = @app.elWidth(td)
      out
