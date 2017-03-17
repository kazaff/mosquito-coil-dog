let _ = require('lodash');

module.exports = function(dslDef, tasks){
	let codeString = `
		function($, done){
			var result={};
			var input={};
			$.output.` + dslDef.name + `={};
	`;

	// 生成input代码
	if(_.has(dslDef, 'input')){
		_.forOwn(dslDef.input, function(value, name){
			if(_.startsWith(value, '$.output.')){
				codeString += 'input.' + name + '=JP.query($,`' + value + '`);';		// jspath解析
			}else if(_.startsWith(value, '"') || _.startsWith(value, "'")){
				codeString += 'input.' + name + '=' + value + ';';
			}else{
				codeString += `
				input.` + name + '=_.get($, `' + value + '`);';
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
		try{
	`;

	codeString += '$.output.' + dslDef.name + '.data=result;';

	// output解析
	if(_.has(dslDef, 'output')){
		codeString += 'var tmp = {}';
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
					result.` + name + `=` + key + `;
				}else if(`;

			let tmp = _.split(_.split(_.trimStart(value, '$.'), '[', 1), '.', 4);
			if(tmp.length === 4){
				tmp = _.join(tmp, '.');
				codeString += tmp + '.error';
			}else{
				tmp = '"never be run this line~"';
				codeString += 'false'
			}

			codeString += `){
					result.` + name + `=` + tmp + `;
				}else{
			`;

			if(_.startsWith(value, '$.output.')){
				codeString += 'tmp.' + name + '=JP.query($,`' + value + '`);';		// jspath解析
			}else if(_.startsWith(value, '"') || _.startsWith(value, "'")){
				codeString += 'tmp.' + name + '=' + value + ';';
			}else{
				codeString += 'tmp.' + name + '=_.get($, `' + value + '`);';
			}

			codeString += `
				}
			}else{
				tmp.` + name + `={error: 424, msg:'` + _.split(key, '.', 3)[2] + ` had not be ran'};
			}
			`;
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

		codeString += `], $, (error)=>{
			if(error){
				return done(error);
			}
		`;
	}

	codeString += 'done();';

	if(_.has(dslDef, 'tasks')){
		codeString += '});';
	}

	return codeString + `
			}catch(e){
				 $.output.` + dslDef.name + `={error:503, msg: e.toString()};
				 done(e);
			}
		}).catch(Promise.TimeoutError, function(e) {
			if($.setting.error && $.setting.error.timout){
		` + '$.output.' + dslDef.name + '=$.setting.error.timout;' + `
			}else{
		` + '$.output.' + dslDef.name + '={error: 503, msg: e.toString()};' + `
			}
			done(e);
		}).catch((e)=>{
			if($.setting.error && $.setting.error.default){
		` + '$.output.' + dslDef.name + '=$.setting.error.default;' + `
			}else{
		` + '$.output.' + dslDef.name + '={error:503, msg:e.toString()};' + `
			}
			done(e);
		});
	}
	`;
};
