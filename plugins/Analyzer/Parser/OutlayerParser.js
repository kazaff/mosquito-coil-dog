let _ = require('lodash');

module.exports = function(dslDef, tasks){

	// 添加外层模块声明
	var codeString = `
		module.exports = function($, done){
	`;

	// 解析默认设置到context.setting中
	if(_.has(dslDef, 'setting')){
		codeString += '$.setting=' + JSON.stringify(dslDef.setting) + ';';
	}else{
		// 若没有定义setting，则使用MCDog默认的超时时间：5000
		codeString += '$.setting={timeout:5000};';
	}

	// 添加导入内置库的代码
	codeString += `
		var async = require('async');
		var _ = require('lodash');
		var Promise = require('bluebird');
		var JP = require('jsonpath');
		var result = {};
	`;

	// 判断子任务是并行还是串行
	if(_.isArray(dslDef.tasks)){	// 并行
		codeString += 'async.applyEach([';
	}else{	//串行
		codeString += 'async.applyEachSeries([';
	}

	// 子任务拼接
	_.forEach(tasks, function(task){
		codeString += task + ',';
	});

	codeString += `], $, (error)=>{
		try{
	`;
	if(_.has(dslDef, 'output')){	// 若定义了output，则需要清理输出数据
		_.forOwn(dslDef.output, function(value, name){
			let key;
			if(_.startsWith(value, '$.')){
				key = _.join(_.split(value, '.', 3),'.');
			}else{
				key = '$.' + _.join(_.split(value, '.', 2),'.');
			}

			codeString += `
			if(` + key + `){
				if(`+ key +`.error){
					result.` + name + `=` + key + `.error;
				}else{
			`;
			if(_.startsWith(value, '$.output.')){
				codeString += 'result.' + name + '=JP.query($,`' + value + '`);';		// jspath解析
			}else if(_.startsWith(value, '"') || _.startsWith(value, "'")){
				codeString += 'result.' + name + '=' + value + ';';
			}else{
				codeString += 'result.' + name + '=_.get($, `' + value + '`);';
			}
			codeString += `
				}
			}else{
				result.` + name + `={error: 424, msg:'` + _.split(key, '.', 3)[2] + ` had not be ran'};
			}
			`;
		});

		codeString += '$.output=result;';
	}

	return codeString + `
			} catch (e) {
				error = e;
				if($.setting.error && $.setting.error.default){
					$.output=$.setting.error.default;
				}else{
					$.output=e.toString();
				}
			} finally {
				done(error);
			}
		});
	}
	`;
};
