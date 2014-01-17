define ['backbone'], (Backbone) ->
  class PageModel extends Backbone.Model
    parse: (resp) ->
      content: resp
