// Very Basic Gruntfile to build jTable
// No efforts made to optimise !! 

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    concat: {
      dist: {
        src: [
          'dev/jquery.jtable.header.txt',
          'dev/jquery.jtable.core.js',
          'dev/jquery.jtable.utils.js',
          'dev/jquery.jtable.forms.js',
          'dev/jquery.jtable.creation.js',
          'dev/jquery.jtable.editing.js',
          'dev/jquery.jtable.deletion.js',
          'dev/jquery.jtable.selecting.js',
          'dev/jquery.jtable.paging.js',
          'dev/jquery.jtable.sorting.js',
          'dev/jquery.jtable.dynamiccolumns.js',
          'dev/jquery.jtable.masterchild.js',
        ],
        dest: 'lib/jquery.jtable.js'
      }
    },

    uglify: {
      target: {
        files: {
          'lib/jquery.jtable.min.js': ['lib/jquery.jtable.js']
        }
      }
  }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');

  // Default task(s).
  grunt.registerTask('default', ['concat', 'uglify']);

};