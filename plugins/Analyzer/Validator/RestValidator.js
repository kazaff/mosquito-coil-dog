let _ = require('lodash');
let URL = require('url');

module.exports = function(dslDef){
	// 必须有domain, method, name
	if( !_.isPlainObject(dslDef)
			|| !_.has(dslDef, 'name') || !_.isString(dslDef.name)
			|| !_.has(dslDef, 'domain') || !_.isString(dslDef.domain)
			|| !_.has(dslDef, 'method') || !_.isString(dslDef.method)
	){
		return {
			state: false,
			msg: 'task miss attribute'
		};
	}

	// method 只能是get, post, put, delete
	if(_.indexOf(['get', 'post', 'put', 'delete'], _.lowerCase(dslDef.method)) < 0){
		return {
			state: false,
			msg: dslDef.name + '\'s method attribute invalid'
		};
	}

	// 若method为post或put，则必须包含body
	if(_.indexOf(['post', 'put'], _.lowerCase(dslDef.method)) >= 0){
		if(!_.has(dslDef, 'body')){
			return {
				state: false,
				msg: dslDef.name + ' miss body attribute'
			};
		}
	}

	if(_.has(dslDef, 'tasks')){
		if(!_.isPlainObject(dslDef.tasks) && !_.isArray(dslDef.tasks)){
			return {
				state: false,
				msg: dslDef.name + '\'s tasks attribute invalid'
			};
		}
	}

	// 若domain不是以//开头，则检查该domain是否合法
	if(!_.startsWith(dslDef.domain, '//')){
		let targetURL = URL.parse(dslDef.domain);
		if(_.indexOf(['http:', 'https:'], targetURL.protocol) < 0){
			return {
				state: false,
				msg: dslDef.name + '\'s domain attribute have invalid protocol'
			};
		}

		if(!_.isNull(targetURL.hash)){
			return {
				state: false,
				msg: dslDef.name + '\'s domain attribute must not include anchor'
			};
		}
	}

	// 若定义input，则必须为对象
	if(_.has(dslDef, 'input')){
		if(!_.isPlainObject(dslDef.input)){
			return {
				state: false,
				msg: dslDef.name + '\'s input attribute must be an object'
			};
		}
	}

	if(_.has(dslDef, 'output')){
		if(!_.isPlainObject(dslDef.output)){
			return {
				state: false,
				msg: dslDef.name + '\'s output attribute must be an object'
			};
		}
	}

	if(_.has(dslDef, 'header')){
		if(!_.isPlainObject(dslDef.header)){
			return {
				state: false,
				msg: dslDef.name + '\'s header attribute must be an object'
			};
		}
	}

	// 若定义了conditions，则该项必须为数组
	if(_.has(dslDef, 'conditions')){
		if(!_.isArray(dslDef.conditions)){
			return {
				state: false,
				msg: dslDef.name + '\'s conditions attribute must be an array'
			};
		}
	}

	if(_.has(dslDef, 'retry')){
		if(!_.isPlainObject(dslDef.retry)){
			return {
				state: false,
				msg: dslDef.name + '\'s retry attribute must be an object'
			};
		}
	}

	return {state: true};
};
