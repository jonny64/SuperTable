define ['backbone'], (Backbone) ->
  class TableModel extends Backbone.Model
    parse: (resp) ->
      head: ("col#{i}" for i in [1..300])
      body: (("val#{j}/#{i}" for i in [1..300]) for j in [1..100])
