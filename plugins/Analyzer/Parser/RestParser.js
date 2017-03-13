let _ = require('lodash');

module.exports = function(dslDef, tasks){
	let codeString = `
		function($, done){
			var Request = require('request');
			var restUrl = require('rest-url');
			var result = {};
			var input = {};
			var headers = {};
			var body = {};
	`;

	// 生成input代码
	if(_.has(dslDef, 'input')){
		_.forOwn(dslDef.input, function(value, name){
			if(_.startsWith(value, '$.')){
				codeString += 'input.' + name + '=JP.query($,\'' + value + '\')[0];';		// jspath解析
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


	// 生成headers代码
	if(_.has(dslDef, 'header')){
		let hasAuth = false;
		_.forOwn(dslDef.header, function(value, name){
			if(name === 'x-auth-token'){
				hasAuth = true;
			}
			if(_.startsWith(value, '$.')){
				codeString += 'headers["' + name + '"]=JP.query($,`' + value + '`)[0];';		// jspath解析
			}else{
				codeString += 'headers["' + name + '"]=' + value + ';';
			}
		});

		if(!hasAuth){
			codeString += `headers["x-auth-token"]=JP.query($, "$.request.header['x-auth-token']")[0];`;		// jspath解析
		}
	}

	// 生成body代码
	if(_.has(dslDef, 'body')){
		if(_.isString(dslDef.body)){
			if(_.startsWith(dslDef.body, '$.')){
				codeString += 'body=JP.query($,\'' + value + '\');';		// jspath解析
			}else{
				codeString += 'body=' + dslDef.body + ';';
			}
		}
	}

	// retry
	if(_.has(dslDef, 'retry')){
		codeString += 'async.retry(' + JSON.stringify(dslDef.retry)  +', function(retryComplate){';
	}

	// 生成request相关代码
	codeString += `
		Request({
			method: '` + dslDef.method + `',
			timeout: ` + (dslDef.timeout ? dslDef.timeout : '$.setting.timeout') + `,
			url: restUrl.make('` + dslDef.domain + `', input),
			headers: headers,
			json: true,
			` + ((_.has(dslDef, 'body'))?'body: body':'') + `
		}, function(err, response, body){
			if(err){
	`;

	if(_.has(dslDef, 'retry')){
		codeString += 'return retryComplate(err);';
	}else{
		codeString += `
				if($.setting.error && $.setting.error.default){
					result=$.setting.error.default;
				}else{
					result=e;
				}
				return resolve();
		`;
	}

	codeString += `
			}
			result=body;
			resolve();
		});
	`;

	if(_.has(dslDef, 'retry')){
		codeString += `}, function(err, result){
			if(err){
				if($.setting.error && $.setting.error.default){
			` + '$.output.' + dslDef.name + '=$.setting.error.default;' + `
				}else{
			` + '$.output.' + dslDef.name + '=e;' + `
				}
				resolve();
			}
		});`;
	}

	if(_.has(dslDef, 'conditions')){
		codeString += `
			}else{
				resolve();
			}
		`;
	}

	// 自定义函数默认超时时间为3000
	codeString += `
}).then(()=>{
	`;

	codeString += '$.output.' + dslDef.name + '=result;';

	// output解析
	if(_.has(dslDef, 'output')){
		codeString += 'var tmp = {};';
		_.forOwn(dslDef.output, function(value, name){
			if(_.startsWith(value, '$.')){
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
