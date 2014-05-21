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
      (new HeaderView(el: @$('@header'), app: @options.app, model: @options.table)).render()
      @table = new TableView(el: @$('@table-container'), app: @options.app, model: @options.table, $container: @$el)
      @table.render()
