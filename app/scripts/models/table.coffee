define ['backbone'], (Backbone) ->
  class TableModel extends Backbone.Model
    initialize: ->
      @currentPage = 0
