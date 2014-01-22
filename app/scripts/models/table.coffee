define ['backbone'], (Backbone) ->
  class TableModel extends Backbone.Model
    parse: (resp) ->
      content: resp
