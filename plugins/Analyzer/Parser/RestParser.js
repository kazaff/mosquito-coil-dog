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
			$.output.` + dslDef.name + `={};
	`;

	// 生成input代码
	if(_.has(dslDef, 'input')){
		_.forOwn(dslDef.input, function(value, name){
			if(_.startsWith(value, '$.output.')){
				codeString += 'input.' + name + '=JP.query($,\'' + value + '\');';		// jspath解析
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


	// 生成headers代码
	if(_.has(dslDef, 'header')){
		let hasAuth = false;
		_.forOwn(dslDef.header, function(value, name){
			if(name === 'x-auth-token'){
				hasAuth = true;
			}
			if(_.startsWith(value, '$.output.')){
				codeString += 'headers["' + name + '"]=JP.query($,`' + value + '`);';		// jspath解析
			}else if(_.startsWith(value, '"') || _.startsWith(value, "'")){
				codeString += 'headers["' + name + '"]=' + value + ';';
			}else{
				codeString += 'headers["' + name + '"]=_.get($, `' + value + '`);';
			}
		});

		if(!hasAuth){
			codeString += `headers["x-auth-token"]=$.request.header['x-auth-token'];`;
		}
	}

	// 生成body代码
	if(_.has(dslDef, 'body')){
		if(_.isString(dslDef.body)){
			if(_.startsWith(dslDef.body, '$.output.')){
				codeString += 'body=JP.query($,`' + dslDef.body + '`);';		// jspath解析
			}else if(_.startsWith(dslDef.body, '"') || _.startsWith(dslDef.body, "'")){
				codeString += 'body=' + dslDef.body + ';';
			}else{
				codeString += 'body=_.get($, `' + dslDef.body + '`);';
			}
		}else{
			codeString += 'var tmp={};';
			_.forOwn(dslDef.body, function(value, name){
				if(_.startsWith(value, '$.output.')){
					codeString += 'tmp.' + name + '=JP.query($,\'' + value + '\');';		// jspath解析
				}else if(_.startsWith(value, '"') || _.startsWith(value, "'")){
					codeString += 'tmp.' + name + '=' + value + ';';
				}else{
					codeString += 'tmp.' + name + '=_.get($, `' + value + '`);';
				}
			});
			codeString+= 'body=tmp;';
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
				if(err.code === 'ETIMEDOUT' && $.setting.error && $.setting.error.timeout){
					result=$.setting.error.timeout;
				}else if($.setting.error && $.setting.error.default){
					result=$.setting.error.default;
				}else{
					result=err;
				}
				return reject(err);
		`;
	}

	codeString += `
			}
			result=body;
			resolve();
		});
	`;

	if(_.has(dslDef, 'retry')){
		codeString += `}, function(err){
			if(err){
				if($.setting.error && $.setting.error.default){
			` + '$.output.' + dslDef.name + '.error=$.setting.error.default;' + `
				}else{
			` + '$.output.' + dslDef.name + '.error=err;' + `
				}
				reject(err);
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
	try{
	`;

	codeString += '$.output.' + dslDef.name + '=result;';

	// output解析
	if(_.has(dslDef, 'output')){
		codeString += 'var tmp = {};';
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
					tmp.` + name + `=` + key + `.error;
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
				 $.output.` + dslDef.name + `.error=e.toString();
				 done(e);
			}
		}).catch((e)=>{
			if($.setting.error && $.setting.error.default){
		` + '$.output.' + dslDef.name + '.error=$.setting.error.default;' + `
			}else{
		` + '$.output.' + dslDef.name + '.error=e.toString();' + `
			}
			done(e);
		});
	}
	`;
};
