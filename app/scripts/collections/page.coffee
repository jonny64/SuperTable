define ['backbone', 'models/page'], (Backbone, PageModel) ->
  class PageCollection extends Backbone.Collection
    model: PageModel
