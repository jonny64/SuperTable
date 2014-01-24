#/*global require*/
'use strict'

require.config
  baseUrl: 'scripts'
  shim:
    'jquery.role': ['jquery']
    fixedheadertable: ['jquery']
    underscore:
      exports: '_'
    backbone:
      deps: [
        'underscore'
        'jquery'
        'jquery.role'
        'fixedheadertable'
      ]
      exports: 'Backbone'
  paths:
    jquery: '../bower_components/jquery/jquery'
    'jquery.role': '../bower_components/rolejs/lib/jquery.role'
    fixedheadertable: '../bower_components/fixedheadertable/jquery.fixedheadertable.min'
    backbone: '../bower_components/backbone/backbone'
    underscore: '../bower_components/underscore/underscore'

define ['app'], (SuperTable) ->
  new SuperTable()
