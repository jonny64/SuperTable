define [
  'backbone',
  'views/footer',
  'templates/layout'],
(Backbone, FooterView, template) ->
  class LayoutView extends Backbone.View
    render: ->
      @$el.empty()
      @$el.html template()
      @$('@footer').html (new FooterView(app: @options.app)).render().el
      containerOptions =
        width: @$('@table-container').width()
        height: @$('@table-container').height()
      @$('@table-container').html @options.table.render(containerOptions).el
