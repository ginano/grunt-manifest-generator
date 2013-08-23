/*
 * grunt-combopage
 * https://github.com/ginano/grunt-combopage
 *
 * Copyright (c) 2013 ginano
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    // Configuration to be run (and then tested).
    manifestGenerator: {
      test: {
        options:{
          //is cache all the html files in source files
          //{Boolean}
          //default:true
          includeHTML:true,
          //is cache all the <img src=""/> images in the  html files in source files
          //{Boolean}
          //default:true
          includeHtmlImage:true,
          //is cache all the style files imported by the html
          //{Boolean}
          //default:true
          includeCSS:true,
          //is cache all the background-images in the css contents, which were used by the  html files
          //{Boolean}
          //default:true
          includeCssImage:true,
          //is cache all the js files in the html files
          //{Boolean}
          //default:true
          includeJS:true,
          //all the files above but the fllowwing files.
          //{Array} the item could be writen as regexpress.
          //default:[]
          excludeFiles:['/\.png$/']
        },
        files: {
          'test.manifest': ['test/test.html']
        }
      }
    }
  });

  // Actually load this plugin's task(s).
  grunt.loadTasks('tasks');

  // By default, lint and run all tests.
  grunt.registerTask('default', ['manifestGenerator']);
};
