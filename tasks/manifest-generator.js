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
  var Util = require('./lib/util');
  var File = grunt.file;


  // Please see the Grunt documentation for more information regarding task
  // creation: http://gruntjs.com/creating-tasks

  grunt.registerMultiTask('manifestGenerator', 'get all files form setting.', function() {
    // Merge task-specific and/or target-specific options with these defaults.
    // 获取配置项
    var options = this.options({
      includeHTML: true,
      includeHtmlImage: true,
      includeCSS: true,
      includeCssImage: true,
      includeJS: true,
      excludeFiles: [],
      extraFiles:[],
      network: '*'
    });
    //保留任务完成句柄
    var Alldone = this.async();
    var filesDone = {};
    var allDoneStamp=false;
    var _v = Date.now();
    /**
     * check all the files have been generated
     * @return {[type]}
     */
     /**
      * 判断是否完成所有的manifest文件生成
      * @return {[type]} [description]
      */
    function checkAllManifestDone() {
      Util.checkAllDone(filesDone, function() {
        if(allDoneStamp){
          return;
        }
        allDoneStamp = true;
        Alldone();
      });
    }

    /**
     * generate the manifest file with fies
     * 根据文件列表生成manifest文件
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
    //初始化所有的文件列表的状态
    this.files.forEach(function(f) {
      filesDone[f.dest]={
        isDone:false,
        destPath: f.dest
      }
    });
    // Iterate over all specified file groups.
    // 遍历文件设置列表
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
      //最终需要生成manifest的目标地址
      var manifestfile = f.dest;
      //record this file's status
      //引用当前manifest文件的内容列表
      filesDone[manifestfile].allFiles=allFiles;

      //get all html content and fileList
      //获取所有的html文件列表及其内容列表
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
      //如果设置了包含html文件本身，就需要遍历所有的html文件列表，但是路径是相对于manifest文件的路径的
      if (OPT.includeHTML) {
        Util.log('find out the followwing html files:');
        tempList.forEach(function(html) {
          var _path = Util.getRelativePath(manifestfile, html);
          allFiles[_path] = true;
          Util.log(_path);
        });
      }
      //get all js files
      //如果包含js文件，遍历所有的script标签中的外联文件地址，同样需要相对于mainifeste文件的路径
      if (OPT.includeJS) {
        //becase the js file's path is relatived to the corresponding html file.
        Util.log('find out the followwing javascript files:');
        htmlSourceList.forEach(function(fileObj) {
          var _list = fileObj.content.match(/<script\s+(?:[^>]+\s+)?src=["']?\s*([^>]+)\s*["']?[\s>\/]/ig) || [];
          _list.forEach(function(js) {
            var str = js.match(/src=["']?\s*([^>"']+)\s*["']?/i)[1].trim(),
              _path;
            if (/^['"]?data:/i.test(str)) {
              return;
            }
            _path = Util.getRelativePath(manifestfile, Util.getAbsolutePath(fileObj.path, str));
            allFiles[_path] = true;
            Util.log(_path);
          });
        });
      }
      //如果包含html中的图片，就需要遍历所有的img和style中的内联样式的背景图片
      //由于js代码中也可能有图片的连接等，但是js由于是需要计算执行的，很可能是个动态的地址，所以js当中的内容需要先过滤掉
      if (OPT.includeHtmlImage) {
        Util.log('find out the followwing images from html content:');
        htmlSourceList.forEach(function(fileObj) {
          //need clear the fake images from js content
          var _list = fileObj.content.replace(/<script[^>]*>(?:[\s\S]*?)<\/script\s*>/ig,'').match(/<img\s+(?:[^>]+\s+)?src=["']?\s*([^>]+)\s*["']?[\s>\/]/ig) || [];
          _list.forEach(function(img) {
            var str = img.match(/src=["']?\s*([^>"']+)\s*["']?/i),
                _path;
            if(!str){
              return;
            }
            str = str[1].trim();
            if(/^['"]?data:/i.test(str)){
              return;
            }
            _path = Util.getRelativePath(manifestfile, Util.getAbsolutePath(fileObj.path, str));
            imageList.push(_path);
            Util.log(_path);
          });
        });
      }
      //如果包含css或者css中的图片就需要遍历所有的css内容，及其中的背景图片
      if (OPT.includeCSS || OPT.includeCssImage) {
        //get css link first
        //获取所有的css外联地址
        htmlSourceList.forEach(function(fileObj) {
          //<link\s+(?:[^>]+\s+)*type=["']\s*text\/css\s*["'](?:\s+[^>]+)*[\s+\/]?>
          var _list = fileObj.content.match(/<link\s+(?:[^>]+\s+)*type=(?:"\s*|'\s*)?text\/css[^>]*>/ig) || [];
          _list.forEach(function(css) {
            var str = css.match(/href=(?:"\s*|'\s*)?([^>"']+)\s*(?:'|"|\s)?/i)[1].trim(),
              _path;
            if (/^['"]?data:/i.test(str)) {
              return;
            }
            _path = Util.getRelativePath(manifestfile, Util.getAbsolutePath(fileObj.path, str));
            cssList.push(_path);
          });
        });
        //如果包含css中的额图片，就需要加载css的内容，并遍历其中的图片
        //if include the image of css, so every inline css, and import css file should be checked
        if (OPT.includeCssImage) {
          // inline style images
          htmlSourceList.forEach(function(fileObj) {
            var _list = fileObj.content.replace(/<script[^>]*>(?:[\s\S]*?)<\/script\s*>/ig,'').match(/url\s*\([^\)]+\)/ig) || [];
            _list.forEach(function(css) {
              var str = css.match(/^url\(([^\)]+)\)$/i)[1].trim(),
                _path;
              if (/^['"]?data:/i.test(str)) {
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
                if (/^['"]?data:/i.test(str)) {
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
      //检查是否都处理完毕
      checkDone();
      //merge all the List

      function checkDone() {
        Util.checkAllDone(delayList, function() {

          var _list = cssList.concat(imageList),
            _opt = options;
          if(filesDone[manifestfile].isDone ){
            return;
          }
          //i should log this result just here;
          Util.log('find out the followwing images from style content:');
          Util.log(imageList.join('\n'));
          //clear the repeat file
          _list.forEach(function(item) {
            allFiles[item.trim()] = true;
          });
          //需要排除的文件列表
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
          //add the addtionnal FILES
          Util.log('\n\nadd the extra files:');
          //需要额外增加的文件列表，比如在js中的文件资源
          _opt.extraFiles.forEach(function(item){
            allFiles[item.trim()] = true;
            Util.log('file :[' + p + '] has been include!');
          });
          filesDone[manifestfile].isDone = true;
          //生成mainifest文件
          generateManifest(manifestfile, allFiles, _opt);
          //add the manifest file to the html files
          //自动将对应的html文件加上或者改写manifest文件的地址
          htmlSourceList.forEach(function(item){
              var _path = Util.getRelativePath(item.path, manifestfile);
              item.content= item.content.replace(/\s+manifest=(?:'\s*|"\s*)?[^>]+(?:\s*'|\s*")?\s*/i,' ').replace(/<html\s*/i, '<html manifest="'+_path+'" ');
              File.write(item.path, item.content);
          });

          Util.log('\nFinally, the result is :');
          Util.log('-----------------------------------    '+manifestfile+'    -----------------------------------');
          for(var p in allFiles){
            Util.log('--    '+p);
          }
          Util.log('-------------------------------------------------------------------------------\n');
          //检查所有的mainfest都生成了
          checkAllManifestDone();
        });
      }
    });
  });
};