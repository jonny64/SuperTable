#/*global require*/
'use strict'

require.config
  baseUrl: 'scripts/'
  shim:
    underscore:
      exports: '_'
    backbone:
      deps: [
        'underscore'
        'jquery'
      ]
      exports: 'Backbone'
  paths:
    jquery: '../bower_components/jquery/jquery'
    backbone: '../bower_components/backbone/backbone'
    underscore: '../bower_components/underscore/underscore'

define ['app'], (SuperTable) ->
  new SuperTable()
  
