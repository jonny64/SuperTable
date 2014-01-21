define [
  'backbone',
  'views/footer',
  'templates/layout'],
(Backbone, FooterView, template) ->
  class LayoutView extends Backbone.View
    render: ->
      @$el.empty()
      @$el.html template()
      @$('@table-container').html @options.table.render().el
      @$('@footer').html (new FooterView(app: @options.app)).render().el
      
