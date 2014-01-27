#/*global require*/
'use strict'

require.config
  baseUrl: 'scripts'
  shim:
    'jquery.role': ['jquery']
    underscore:
      exports: '_'
    backbone:
      deps: [
        'underscore'
        'jquery'
        'jquery.role'
        'jquery.spin'
      ]
      exports: 'Backbone'
  paths:
    jquery: '../bower_components/jquery/jquery'
    'jquery.role': '../bower_components/rolejs/lib/jquery.role'
    spin: '../bower_components/spinjs/spin'
    'jquery.spin': '../bower_components/spinjs/jquery.spin'
    backbone: '../bower_components/backbone/backbone'
    underscore: '../bower_components/underscore/underscore'

define ['app'], (SuperTable) ->
  new SuperTable()
