let _ = require('lodash');

module.exports = function(dslDef, tasks){
	let codeString = `
		function($, done){
			var result = {};
			var input = {};
	`;

	// 生成input代码
	if(_.has(dslDef, 'input')){
		_.forOwn(dslDef.input, function(value, name){
			if(_.startsWith(value, '$.')){
				codeString += 'input.' + name + '=JP.query($,\'' + value + '\');';		// jspath解析
			}else{
				codeString += 'input.' + name + '=' + value + ';';
			}
		});
	}

	// 生成自定义函数promise
	codeString += `
		new Promise(function(resolve, reject){
	`;

	if(_.has(dslDef, 'conditions')){
		codeString += 'if(' + dslDef.conditions.join(' && ') + '){';
	}

	// 生成函数调用代码
	codeString += '(' + dslDef.defination.toString() + '(input, result, resolve));';


	if(_.has(dslDef, 'conditions')){
		codeString += `
			}else{
				resolve();
			}
		`;
	}

	// 自定义函数默认超时时间为3000
	codeString += `
}).timeout(3000)
		.then(()=>{
	`;

	codeString += '$.output.' + dslDef.name + '=result;';

	// 子任务
	if(_.has(dslDef, 'tasks')){
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

		codeString += '], $, ()=>{';
	}

	codeString += 'done();';

	if(_.has(dslDef, 'tasks')){
		codeString += '});';
	}

	return codeString + `
		}).catch((e)=>{
 ` + '$.output.' + dslDef.name + '=e;' + `
			done();
		});
	}
	`;
};
