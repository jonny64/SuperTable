'use strict';
var LIVERELOAD_PORT = 35729;
var SERVER_PORT = 3001;
var lrSnippet = require('connect-livereload')({port: LIVERELOAD_PORT});
var mountFolder = function (connect, dir) {
    return connect.static(require('path').resolve(dir));
};

// # Globbing
// for performance reasons we're only matching one level down:
// 'test/spec/{,*/}*.js'
// use this if you want to match all subfolders:
// 'test/spec/**/*.js'
// templateFramework: 'lodash'

module.exports = function (grunt) {
    // show elapsed time at the end
    require('time-grunt')(grunt);
    // load all grunt tasks
    require('load-grunt-tasks')(grunt);

    grunt.loadNpmTasks('grunt-haml');
    grunt.loadNpmTasks('grunt-version');

    // configurable paths
    var yeomanConfig = {
        app: 'app',
        dist: 'dist'
    };

    grunt.initConfig({
        uglify: {
          options: {
            sourceMap: 'dist/application.js.map'
          }
        },
        version: {
          options: {
            build_number: process.env.BUILD_NUMBER
          },
          defaults: {
            src: ['app/scripts/app.coffee']
          }
        },
        yeoman: yeomanConfig,
        watch: {
            options: {
                nospawn: true,
                livereload: true
            },
            coffee: {
                files: ['<%= yeoman.app %>/scripts/{,*/}*.coffee'],
                tasks: ['coffee:dist']
            },
            coffeeTest: {
                files: ['test/spec/{,*/}*.coffee'],
                tasks: ['coffee:test']
            },
            haml: {
                files: ['<%= yeoman.app %>/scripts/templates/{,*/}*.haml'],
                tasks: ['haml']
            },
            compass: {
                files: ['<%= yeoman.app %>/styles/{,*/}*.{scss,sass}'],
                tasks: ['compass']
            },
            livereload: {
                options: {
                    livereload: LIVERELOAD_PORT
                },
                files: [
                    '<%= yeoman.app %>/*.html',
                    '{.tmp,<%= yeoman.app %>}/styles/{,*/}*.css',
                    '{.tmp,<%= yeoman.app %>}/scripts/{,*/}*.js',
                    '<%= yeoman.app %>/images/{,*/}*.{png,jpg,jpeg,gif,webp}',
                    '<%= yeoman.app %>/scripts/templates/{,*/}*.{ejs,mustache,hbs,haml}',
                    'test/spec/**/*.js'
                ]
            },
            jst: {
                files: [
                    '<%= yeoman.app %>/scripts/templates/*.ejs'
                ],
                tasks: ['jst']
            },
            test: {
                files: ['<%= yeoman.app %>/scripts/{,*/}*.js', 'test/spec/**/*.js'],
                tasks: ['test']
            }
        },
        connect: {
            options: {
                port: SERVER_PORT,
                // change this to '0.0.0.0' to access the server from outside
                hostname: '0.0.0.0'
            },
            livereload: {
                options: {
                    middleware: function (connect) {
                        return [
                            lrSnippet,
                            mountFolder(connect, '.tmp'),
                            mountFolder(connect, yeomanConfig.app)
                        ];
                    }
                }
            },
            test: {
                options: {
                    port: 9001,
                    middleware: function (connect) {
                        return [
                            lrSnippet,
                            mountFolder(connect, '.tmp'),
                            mountFolder(connect, 'test'),
                            mountFolder(connect, yeomanConfig.app)
                        ];
                    }
                }
            },
            dist: {
                options: {
                    middleware: function (connect) {
                        return [
                            mountFolder(connect, yeomanConfig.dist)
                        ];
                    }
                }
            }
        },
        open: {
            server: {
                path: 'http://localhost:<%= connect.options.port %>'
            }
        },
        clean: {
            dist: ['.tmp', '<%= yeoman.dist %>/*'],
            server: '.tmp'
        },
        jshint: {
            options: {
                jshintrc: '.jshintrc',
                reporter: require('jshint-stylish')
            },
            all: [
                'Gruntfile.js',
                '<%= yeoman.app %>/scripts/{,*/}*.js',
                '!<%= yeoman.app %>/scripts/vendor/*',
                'test/spec/{,*/}*.js'
            ]
        },
        mocha: {
            all: {
                options: {
                    run: true,
                    urls: ['http://localhost:<%= connect.test.options.port %>/index.html']
                }
            }
        },
        coffee: {
            options: {
              sourceMap: false
            },
            dist: {
                files: [{
                    // rather than compiling multiple files here you should
                    // require them into your main .coffee file
                    expand: true,
                    cwd: '<%= yeoman.app %>/scripts',
                    src: '{,*/}*.coffee',
                    dest: '.tmp/scripts',
                    ext: '.js'
                }]
            },
            test: {
                files: [{
                    expand: true,
                    cwd: 'test/spec',
                    src: '{,*/}*.coffee',
                    dest: '.tmp/spec',
                    ext: '.js'
                }]
            }
        },
        compass: {
            options: {
                sassDir: '<%= yeoman.app %>/styles',
                cssDir: '.tmp/styles',
                imagesDir: '<%= yeoman.app %>/images',
                javascriptsDir: '<%= yeoman.app %>/scripts',
                fontsDir: '<%= yeoman.app %>/styles/fonts',
                importPath: '<%= yeoman.app %>/bower_components',
                relativeAssets: true
            },
            dist: {},
            server: {
                options: {
                    debugInfo: true
                }
            }
        },
        requirejs: {
            dist: {
                // Options: https://github.com/jrburke/r.js/blob/master/build/example.build.js
                options: {
//                    almond: true,
                    almond: false,
                    replaceRequireScript: [{
                        files: ['dist/index.html'],
                        module: 'main',
                        modulePath: 'dist/scripts/main'
                    }],
                    // `name` and `out` is set by grunt-usemin
                    baseUrl: '.tmp/scripts',
                    optimize: 'none',
                    paths: {
                        'templates': '../../.tmp/scripts/templates',
                        'jquery.role': '../../app/bower_components/rolejs/lib/jquery.role',
                        'jquery.spin': '../../app/bower_components/spinjs/jquery.spin',
                        'jquery-mousewheel': '../../app/bower_components/jquery-mousewheel/jquery.mousewheel',
                        'spin': '../../app/bower_components/spinjs/spin',
//                        'jquery': '../../app/bower_components/jquery/jquery',
                        'jquery': '../../jquery-fake',
                        'underscore': '../../app/bower_components/underscore/underscore',
                        'backbone': '../../app/bower_components/backbone/backbone'
                    },
                    preserveLicenseComments: false,
                    useStrict: true,
                    wrap: {
				start: "(function() {",
				end  : "define(['main'], function(SuperTable) {return SuperTable;});}).call(this);"
//                        start: "(function(root, factory){if(typeof define === 'function' && define.amd){define([], factory);}else{root.SuperTable = factory();}}(this, function() {",
//                        end: "return require('main');}));"
                    }
                }
            }
        },
        useminPrepare: {
            html: '<%= yeoman.app %>/index.html',
            options: {
                dest: '<%= yeoman.dist %>'
            }
        },
        usemin: {
            html: ['<%= yeoman.dist %>/{,*/}*.html'],
            css: ['<%= yeoman.dist %>/styles/{,*/}*.css'],
            options: {
                dirs: ['<%= yeoman.dist %>']
            }
        },
        imagemin: {
            dist: {
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>/images',
                    src: '{,*/}*.{png,jpg,jpeg}',
                    dest: '<%= yeoman.dist %>/images'
                }]
            }
        },
        cssmin: {
            dist: {
                files: {
                    '<%= yeoman.dist %>/styles/main.css': [
                        '.tmp/styles/{,*/}*.css',
                        '<%= yeoman.app %>/styles/{,*/}*.css'
                    ]
                }
            }
        },
        htmlmin: {
            dist: {
                options: {
                    /*removeCommentsFromCDATA: true,
                    // https://github.com/yeoman/grunt-usemin/issues/44
                    //collapseWhitespace: true,
                    collapseBooleanAttributes: true,
                    removeAttributeQuotes: true,
                    removeRedundantAttributes: true,
                    useShortDoctype: true,
                    removeEmptyAttributes: true,
                    removeOptionalTags: true*/
                },
                files: [{
                    expand: true,
                    cwd: '<%= yeoman.app %>',
                    src: ['*.html', '!index.html', '!contents.html'],
                    dest: '<%= yeoman.dist %>'
                }]
            }
        },
        copy: {
            dist: {
                files: [{
                    expand: true,
                    dot: true,
                    cwd: '<%= yeoman.app %>',
                    dest: '<%= yeoman.dist %>',
                    src: [
                        '*.{ico,txt}',
                        '.htaccess',
                        'images/{,*/}*.{webp,gif}',
                        'data/*.json',
                        'styles/fonts/{,*/}*.*',
                        'bower_components/sass-bootstrap/fonts/*.*'
                    ]
                }]
            },
            index: {
                files: {
                    '<%= yeoman.dist %>/index.html': '<%= yeoman.app %>/index.html'
                }
            },
            lib: {
                files: {
                    'lib/supertable.js': '<%= yeoman.dist %>/scripts/main.js',
                    'lib/modernizr.js': '<%= yeoman.dist %>/scripts/vendor/modernizr.js'
                }
            },
            libMin: {
                files: {
                    'lib/supertable.min.js': '<%= yeoman.dist %>/scripts/main.js',
                    'lib/supertable.css': '<%= yeoman.dist %>/styles/main.css',
                    'lib/modernizr.min.js': '<%= yeoman.dist %>/scripts/vendor/modernizr.js'
                }
            }
        },
        bower: {
            all: {
                rjsConfig: '<%= yeoman.app %>/scripts/main.js'
            }
        },
        jst: {
            options: {
                amd: true
            },
            compile: {
                files: {
                    '.tmp/scripts/templates.js': ['<%= yeoman.app %>/scripts/templates/*.ejs']
                }
            }
        },
        haml: {
            options: {
                placement: 'amd',
                dependencies: {
                    '$': 'jquery',
                    '_': 'underscore'
                },
                target: 'js',
                language: 'coffee'
            },
            files: {
                expand: true,
                cwd: '<%= yeoman.app %>/scripts/templates',
                src: '{,*/}*.haml',
                dest: '.tmp/scripts/templates',
                ext: '.js'
            }
        },
        rev: {
            dist: {
                files: {
                    src: [
                        '<%= yeoman.dist %>/scripts/{,*/}*.js',
                        '<%= yeoman.dist %>/styles/{,*/}*.css',
                        '<%= yeoman.dist %>/images/{,*/}*.{png,jpg,jpeg,gif,webp}',
                        '/styles/fonts/{,*/}*.*',
                        'bower_components/sass-bootstrap/fonts/*.*'
                    ]
                }
            }
        }
    });

    grunt.registerTask('createDefaultTemplate', function () {
        grunt.file.write('.tmp/scripts/templates.js', 'this.JST = this.JST || {};');
    });

    grunt.registerTask('server', function (target) {
        if (target === 'dist') {
            return grunt.task.run(['build', 'open', 'connect:dist:keepalive']);
        }

        if (target === 'test') {
            return grunt.task.run([
                'clean:server',
                'coffee',
                'createDefaultTemplate',
                'jst',
                'haml',
                'compass:server',
                'connect:test',
                'watch:livereload'
            ]);
        }

        grunt.task.run([
            'clean:server',
            'coffee:dist',
            'createDefaultTemplate',
            'jst',
            'haml',
            'compass:server',
            'connect:livereload',
            'open',
            'watch'
        ]);
    });

    grunt.registerTask('test', [
        'clean:server',
        'coffee',
        'createDefaultTemplate',
        'jst',
        'compass',
        'connect:test',
        'mocha',
        'watch:test'
    ]);

    grunt.registerTask('build', [
        'clean:dist',
        'version',
        'coffee',
        'createDefaultTemplate',
        'jst',
        'haml',
        'compass:dist',
        'useminPrepare',
        'copy:index',
        'requirejs',
        'imagemin',
        'htmlmin',
        'concat',
        'copy:lib',
        'cssmin',
        'uglify',
        'copy:dist',
        'copy:libMin',
        'rev',
        'usemin'
    ]);

    grunt.registerTask('default', [
        'jshint',
        'test',
        'build'
    ]);
};
