(function() {
  module.exports.register = function(Handlebars, options) {
    var path  = require('path');

    Handlebars.registerHelper('assets-demo', function(dirname) {
      var dir = ! dirname.hash ? dirname : this.page.dirname;
      var assetsDemo = 'dist/demos/assets-demo/';
      var relativePath = path.relative(dir, assetsDemo);
      return new Handlebars.SafeString(relativePath);
    });
  };
}).call(this);