module.exports = function(config) {

  /**
   * This is a configuration for Karma runner for continous integration purposes.
   *
   * You can modify the settings when running test suite from command line, refer to online documentation
   * for the runner or see comments bellow.
   */
  config.set({
    // base path, that will be used to resolve files and exclude
    basePath: '',

    frameworks: ['jasmine', 'requirejs'],

    // list of files / patterns to load in the browser
    files: [

      /**
       * the file which will be ran as the browser is started,
       * it start RequestJS dependency resolution and test loading
       */
      'test/test-main.js',

      /**
       * These files are loaded by Karma HTTP server which serves resources to test,
       * but they are not run automatically
       */
      // test dependencies
      {pattern: 'lib/jquery-simulate/jquery.simulate.js', included: false},
      {pattern: 'lib/jasmine-jquery/lib/jasmine-jquery.js', included: false},
      {pattern: 'lib/dom-compare/**/*.js', included: false},

      // runtime dependencies
      {pattern: 'lib/jquery/jquery.js', included: false},
      {pattern: 'lib/jquery-ui/ui/jquery-ui.js', included: false},

      // richwidgets sources
      {pattern: 'src/**/*.js', included: false},
      {pattern: 'dist/assets/**/*.css', included: false},

      // tests
      {pattern: 'test/**/*.js', included: false},
      {pattern: 'test/**/*.html', included: false}
    ],


    preprocessors: {
      // do not preprocess HTML files with html2js
      '**/*.html': []
    },


    // list of files to exclude
    exclude: [
    ],


    // test results reporter to use
    // possible values: 'dots', 'progress', 'junit', 'growl', 'coverage', 'spec'
    reporters: ['progress'],


    // web server port
    port: 9876,


    // cli runner port
    runnerPort: 9100,


    // enable / disable colors in the output (reporters and logs)
    colors: true,


    // level of logging
    // possible values: LOG_DISABLE || LOG_ERROR || LOG_WARN || LOG_INFO || LOG_DEBUG
    logLevel: config.LOG_INFO,


    // enable / disable watching file and executing tests whenever any file changes
    //
    // use $ karma ... -auto-watch=true from command-line
    autoWatch: false,


    // Start these browsers, currently available:
    // - Chrome
    // - ChromeCanary
    // - Firefox
    // - Opera
    // - Safari (only Mac)
    // - PhantomJS
    // - IE (only Windows)
    //
    // use $ karma ... -browsers=PhantomJS,Firefox,Chrome from command-line
    browsers: ['PhantomJS'],


    // If browser does not capture in given timeout [ms], kill it
    captureTimeout: 60000,


    // Continuous Integration mode
    // if true, it capture browsers, run tests and exit
    //
    // use $ karma ... -single-run=false from command-line
    singleRun: true

  });

};