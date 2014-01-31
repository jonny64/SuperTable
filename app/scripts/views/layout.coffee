define [
  'backbone',
  'views/table',
  'views/header',
  'templates/layout'],
(Backbone, TableView, HeaderView, template) ->
  class LayoutView extends Backbone.View
    render: ->
      @$el.empty()
      @$el.html template()
      (new HeaderView(app: @options.app, model: @options.table)).render()
      (new TableView(app: @options.app, model: @options.table)).render()
