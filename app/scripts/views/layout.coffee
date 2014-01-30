define [
  'backbone',
  'views/table',
  'views/footer',
  'templates/layout'],
(Backbone, TableView, FooterView, template) ->
  class LayoutView extends Backbone.View
    render: ->
      @$el.empty()
      @$el.html template()
      (new FooterView(app: @options.app)).render()
      (new TableView(app: @options.app, model: @options.table)).render()
