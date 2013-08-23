grunt-manifest-generator
========================

>this tool will scan all the html files, and get all the images, css, js, html to generator the manifest file.

## Getting Started
This plugin requires Grunt `~0.4.1`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-manifest-generator
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-manifest-generator');
```

You can run the testcase. change you path to ./node_modeules/grunt-manifest-generator/, and run grunt. You could see the result file ./output/test.manifest file was created! The ./Gruntfile.js has the base function of this task, so you could use it as that. If you have any question, you can contact me at sina weibo: http://weibo.com/ginano
## The "manifest-generator" task

### Overview
In your project's Gruntfile, add a section named `manifestGenerator` to the data object passed into `grunt.initConfig()`.

```js
'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    // Configuration to be run (and then tested).
    manifestGenerator:{
      test: {
        options:{
          //is cache all the html files in source files
          //{Boolean}
          //default:true
          includeHTML:true,
          //is cache all the images tags or inline style with background-images in the  html files in source files
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
          //the task will scan all the source files, and generate 'test.manifest' file as the cache setting. 
          'test.manifest': ['test/test.html','test/index.html']
        }
      }
    }
  });
  // Actually load this plugin's task(s).
  grunt.loadNpmTasks('grunt-manifest-generator');
  grunt.registerTask('grunt', ['manifestGenerator:test']);
};
```


## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).

## Release History
2013-8-23 0.1.0 create the plugin
