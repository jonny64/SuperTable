define ['backbone'], (Backbone) ->
  class TableModel extends Backbone.Model
    parse: (resp) ->
      head: ({width: 100+(i*10%150), content:"col#{i}"} for i in [1..300])
      body: (({content: "val#{j}/#{i}"} for i in [1..300]) for j in [1..100])
