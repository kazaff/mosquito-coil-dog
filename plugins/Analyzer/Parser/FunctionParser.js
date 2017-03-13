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
			if(_.startsWith(value, '$.output.')){
				codeString += 'input.' + name + '=JP.query($,`' + value + '`)[0];';		// jspath解析
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

	// output解析
	if(_.has(dslDef, 'output')){
		codeString += 'var tmp = {}';
		_.forOwn(dslDef.output, function(value, name){
			if(_.startsWith(value, '$.output.')){
				codeString += 'tmp.' + name + '=JP.query($,`' + value + '`)[0];';		// jspath解析
			}else{
				codeString += 'tmp.' + name + '=' + value + ';';
			}
		});
		codeString += '$.output.' + dslDef.name + '=tmp;';
	}

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
		}).catch(Promise.TimeoutError, function(e) {
			if($.setting.error && $.setting.error.timout){
		` + '$.output.' + dslDef.name + '=$.setting.error.timout;' + `
			}else{
		` + '$.output.' + dslDef.name + '=e;' + `
			}
			done();
		}).catch((e)=>{
			if($.setting.error && $.setting.error.default){
		` + '$.output.' + dslDef.name + '=$.setting.error.default;' + `
			}else{
		` + '$.output.' + dslDef.name + '=e;' + `
			}
			done();
		});
	}
	`;
};
