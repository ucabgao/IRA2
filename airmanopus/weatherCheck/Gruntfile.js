module.exports = function(grunt){
	grunt.initConfig({
		jshint: {
			 files: ['js/weathercheck_new.js', 'node/app.js'],
			},
		uglify: {
			'js/weathercheck_new.min.js':['js/weathercheck_new.js'],
		
			},
	});
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.registerTask('default', ['jshint']);
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.registerTask('default', ['uglify']);

};

