/*
 * grunt-combopage
 * https://github.com/ginano/grunt-combopage
 *
 * Copyright (c) 2013 ginano
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {
  var path = require('path');
  var URL = require('url');
  var http = require('http');
  var Util = require('./lib/util').init(grunt);
  var File = grunt.file;


  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('manifestGenerator', 'get all files form setting.', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      includeHTML: true,
      includeHtmlImage: true,
      includeCSS: true,
      includeCssImage: true,
      includeJS: true,
      excludeFiles: [],
      network: '*'
    });
    var Alldone = this.async();
    var filesDone = {};
    var _v = Date.now();
    /**
     * check all the files have been generated
     * @return {[type]}
     */

    function checkAllManifestDone() {
      Util.checkAllDone(filesDone, function() {
        Alldone();
      });
    }

    /**
     * generate the manifest file with fies
     * @param  {[type]} path
     * @param  {[type]} files
     * @return {[type]}
     */

    function generateManifest(path, files, options) {
      var _text = [];
      var p;
      options = options || {};
      _text.push('CACHE MANIFEST');
      _text.push('# ' + new Date());
      _text.push('NETWORK:');
      _text.push(options.network || '*');
      _text.push('CACHE:');
      for (p in files) {
        _text.push(p);
      }
      File.write(path, _text.join('\n'));
    }
    //init the file list
    this.files.forEach(function(f) {
      filesDone[f.dest]={
        isDone:false,
        destPath: f.dest
      }
    });
    // Iterate over all specified file groups.
    this.files.forEach(function(f) {
      //all the path is relative to the html file
      var htmlSourceList = [],
        cssList = [],
        tempList,
        imageList = [],
        delayList = [];
      //the finnaly files
      var allFiles = {};
      var OPT = options;
      var allHtmlContent = '';
      //the path of  manifest
      var manifestfile = f.dest;
      //record this file's status
      filesDone[manifestfile].allFiles=allFiles;

      //get all html content and fileList
      tempList = f.src.filter(function(filepath) {
        var fileObj = {
          path: filepath
        };
        // Warn on and remove invalid source files (if nonull was set).
        if (!File.exists(filepath)) {
          Util.log('Source file "' + filepath + '" not found.', 'error');
          return false;
        } else {
          fileObj.content = File.read(filepath);
          htmlSourceList.push(fileObj);
          allHtmlContent += fileObj.content;
          return true;
        }
      });
      //get all the include HTML FILES
      if (OPT.includeHTML) {
        Util.log('find out the followwing html files:');
        tempList.forEach(function(html) {
          var _path = Util.getRelativePath(manifestfile, html);
          allFiles[_path] = true;
          Util.log(_path);
        });
      }
      //get all js files
      if (OPT.includeJS) {
        //becase the js file's path is relatived to the corresponding html file.
        Util.log('find out the followwing javascript files:');
        htmlSourceList.forEach(function(fileObj) {
          var _list = fileObj.content.match(/<script\s+(?:[^>]+\s+)?src=["']?\s*([^>]+)\s*["']?[\s>\/]/ig) || [];
          _list.forEach(function(js) {
            var str = js.match(/src=["']?\s*([^>"']+)\s*["']?/i)[1].trim(),
              _path;
            if (/^data:/.test(str)) {
              return;
            }
            _path = Util.getRelativePath(manifestfile, Util.getAbsolutePath(fileObj.path, str));
            allFiles[_path] = true;
            Util.log(_path);
          });
        });
      }

      if (OPT.includeHtmlImage) {
        Util.log('find out the followwing images from html content:');
        htmlSourceList.forEach(function(fileObj) {
          var _list = fileObj.content.match(/<img\s+(?:[^>]+\s+)?src=["']?\s*([^>]+)\s*["']?[\s>\/]/ig) || [];
          _list.forEach(function(img) {
            var str = img.match(/src=["']?\s*([^>"']+)\s*["']?/i)[1].trim(),
              _path;
            if (/^data:/.test(str)) {
              return;
            }
            _path = Util.getRelativePath(manifestfile, Util.getAbsolutePath(fileObj.path, str));
            imageList.push(_path);
            Util.log(_path);
          });
        });
      }

      if (OPT.includeCSS || OPT.includeCssImage) {
        //get css link first
        htmlSourceList.forEach(function(fileObj) {
          //<link\s+(?:[^>]+\s+)*type=["']\s*text\/css\s*["'](?:\s+[^>]+)*[\s+\/]?>
          var _list = fileObj.content.match(/<link\s+(?:[^>]+\s+)*type=(?:"\s*|'\s*)?text\/css[^>]*>/ig) || [];
          _list.forEach(function(css) {
            var str = css.match(/href=(?:"\s*|'\s*)?([^>"']+)\s*(?:'|"|\s)?/i)[1].trim(),
              _path;
            if (/^data:/.test(str)) {
              return;
            }
            _path = Util.getRelativePath(manifestfile, Util.getAbsolutePath(fileObj.path, str));
            cssList.push(_path);
          });
        });
        //if include the image of css, so every inline css, and import css file should be checked
        if (OPT.includeCssImage) {
          // inline style images
          htmlSourceList.forEach(function(fileObj) {
            var _list = fileObj.content.match(/url\s*\([^\)]+\)/ig) || [];
            _list.forEach(function(css) {
              var str = css.match(/^url\(([^\)]+)\)$/i)[1].trim(),
                _path;
              if (/^data:/.test(str)) {
                return;
              }
              _path = Util.getRelativePath(manifestfile, Util.getAbsolutePath(fileObj.path, str));
              imageList.push(_path);
            });
          });
          //scan import css file
          cssList.forEach(function(css) {
            var _path = Util.getAbsolutePath(manifestfile, css);
            var _content,
              _list;
            var cssCheck = {
              isDone: false
            };
            delayList.push(cssCheck);
            Util.getContent(_path, function(data) {
              var _list = data.match(/url\s*\([^\)]+\)/ig) || [];
              _list.forEach(function(img) {
                var str = img.match(/^url\(([^\)]+)\)$/i)[1].trim(),
                  __path;
                if (/^data:/.test(str)) {
                  return;
                }
                __path = Util.getRelativePath(manifestfile, Util.getAbsolutePath(_path, str));
                imageList.push(__path);
              });
              cssCheck.isDone = true;
              checkDone();
            });
          });
        }
        if (!OPT.includeCSS) {
          cssList = [];
        } else {
          Util.log('find out the followwing css files:');
          Util.log(cssList.join('\n'));
        }
      }

      checkDone();
      //merge all the List

      function checkDone() {
        Util.checkAllDone(delayList, function() {
          var _list = cssList.concat(imageList),
            _opt = options;
          //i should log this result just here;
          Util.log('find out the followwing images from style content:');
          Util.log(imageList.join('\n'));
          //clear the repeat file
          _list.forEach(function(item) {
            allFiles[item.trim()] = true;
          });
          //exclude files
          _opt.excludeFiles.forEach(function(item) {
            var p, re, exp;
            re = item.match(/^\/([\S\s]+)\/(?:[igm])?$/i);
            //if the regexpress
            if (re && re[1]) {
              exp = re[1];
            } else {
              exp = item
            }
            exp = new RegExp(exp, 'i');
            for (p in allFiles) {
              if (exp.test(p)) {
                allFiles[p] = null;
                Util.log('file :[' + p + '] has been exclude!', 'error');
                delete allFiles[p];
              }
            }
          });
          filesDone[manifestfile].isDone = true;
          generateManifest(manifestfile, allFiles, _opt);
          //add the manifest file to the html files
          htmlSourceList.forEach(function(item){
              var _path = Util.getRelativePath(item.path, manifestfile);
              item.content= item.content.replace(/\s+manifest=(?:'\s*|"\s*)?[^>]+(?:\s*'|\s*")?\s*/i,' ').replace(/<html\s+/i, '<html manifest="'+_path+'"');
              File.write(item.path, item.content);
          });

          Util.log('\nFinally, the result is :');
          Util.log('-----------------------------------    '+manifestfile+'    -----------------------------------');
          for(var p in allFiles){
            Util.log('--    '+p);
          }
          Util.log('-------------------------------------------------------------------------------\n');
          checkAllManifestDone();
        });
      }
    });
  });
};