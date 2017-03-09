let _ = require('lodash');

module.exports = function(dslDef){
	// 检查服务定义必填项
	if( !_.isPlainObject(dslDef)
			|| !_.has(dslDef, 'name') || !_.isString(dslDef.name)
			|| !_.has(dslDef, 'version') || !_.isNumber(dslDef.version)
			|| !_.has(dslDef, 'priority') || !_.isNumber(dslDef.priority)
			|| !_.has(dslDef, 'type')	|| !_.isString(dslDef.type)
			|| !_.has(dslDef, 'method')	|| !_.isString(dslDef.method)
	){
		return {
			state: false,
			msg: 'service miss attribute'
		};
	}

	// 若定义了output，则该项必须为对象
	if(_.has(dslDef, 'output')){
		if(!_.isPlainObject(dslDef.output)){
			return {
				state: false,
				msg: 'service\'s output attribute must be an object'
			};
		}
	}

	// 若定义了setting，则该项必须为对象
	if(_.has(dslDef, 'setting')){
		if(!_.isPlainObject(dslDef.setting)){
			return {
				state: false,
				msg: 'service\'s setting attribute must be an object'
			};
		}
	}

	return {state: true};
};
