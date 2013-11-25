'use strict';

var Path = require('path');
var Url = require('url');
var Http = require('http');
var File = require('fs');

/**
 * output the log to the console
 * @param  {String} str
 * @param  {String} type 'log'/'error'
 * @return {undefined}
 */
function log(str, type) {
	switch(type){
		case 'error':
			console.error(str);
			break;
		case 'warn':
			console.warn(str);
			break;
		case 'info':
			console.info(str);
			break;
		default:
			console.log(str);
	}
}
/**
 * check the str is or isnot url, such as http:// or //www.baidu.com
 * @param  {String}  str
 * @return {Boolean}
 */
function isUrl(str) {
	return /^(\S+:)?\/\//i.test(str.trim());
}
/**
 * check the type of obj is function
 * @param  {Object}  obj
 * @return {Boolean}
 */
function isFunction(obj){
	return 'function' === typeof obj;
}
/**
 * get the file content of url, when the content has been gotten, it will call the function of callback
 * please pay attention that the function is asynchronous
 * @param  {String}   url
 * @param  {Function} callback
 * @param  {Function}   errorcall
 * @return {undefined}
 */
function getContent(url, callback, errorcall) {
	var _content = '';
	//from net
	if (isUrl(url)) {
		//下载内容，监听数据成功的事件
		Http.get(url, function(res) {
			res.on('data', function(data) {
				_content += data;
			})
				.on('end', function() {
					if (isFunction(callback)) {
						callback(_content);
						return;
					}
					log("Got response: " + _content);
				});
		}).on('error', function(e) {
			if (isFunction(errorcall)) {
				e.url = url;
				errorcall(e);
				return;
			}
			log("Got error from [" + url + "]:\n" + e.message, 'error');
		});
	} else {// read from local disk
		setTimeout(function() {
			try {
				//should clear the query string
				_content = File.readFileSync(url.replace(/[?#]\S+$/i,'')).toString();
				if (isFunction(callback)) {
					callback(_content);
					return;
				}
				log("Got response: " + _content);
			} catch (e) {
				if (isFunction(errorcall)) {
					e.url = url;
					errorcall(e);
					return;
				}
				log("Got error from [" + url + "]:\n" + e.message, 'error');
			}
		}, 0);
	}
}
/**
 * get the absoulte path of file relativePath, which relatived to targetFilePath
 * @param  {String} targetFilePath
 * @param  {String} relativePath
 * @return {String}
 */
function getAbsolutePath(targetFilePath, relativePath) {
	relativePath = relativePath.trim();
	if (isUrl(relativePath)) {
		return relativePath;
	}
	if (isUrl(targetFilePath)) {
		return Url.resolve(targetFilePath, relativePath);
	}
	return Path.normalize(Path.dirname(targetFilePath) + '/' + relativePath);
}
/**
 * get the relative path of file sourcePath, which relatived to targetFilePath
 * @param  {[type]} targetFilePath
 * @param  {[type]} sourcePath
 * @return {[type]}
 */
function getRelativePath(targetFilePath, sourcePath) {
	sourcePath = sourcePath.trim();
	if (isUrl(sourcePath)) {
		return sourcePath;
	}
	return Path.relative(Path.dirname(targetFilePath), sourcePath).replace(/\\/g, '/');
}
/**
 * are all  the List items have completed?
 * @param  {Array} checkList
 * @param {Function} callback if all have done, call this function.
 * @return {Boolean}
 */
function checkAllDone(checkList, callback){
	var l;
    if(checkList.__isDone){
      return;
    }
    if(checkList instanceof Array){
    	l= checkList.length;
    	while(l--){
	      if(!checkList[l].isDone){
	        return;
	      }
	    }
    } else {
    	for(l in checkList){
    		if(!checkList[l].isDone){
    			return;
    		}
    	}
    }
    //has done, may be the array is nevery use
    checkList.__isDone=true;
    callback();
}
module.exports= {
	log: log,
	isUrl: isUrl,
	isFunction: isFunction,
	getContent: getContent,
	getAbsolutePath: getAbsolutePath,
	getRelativePath: getRelativePath,
	checkAllDone: checkAllDone
};
