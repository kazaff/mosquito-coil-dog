let _ = require('lodash');

module.exports = function(dslDef){

	if( !_.isPlainObject(dslDef)
			|| !_.has(dslDef, 'name') || !_.isString(dslDef.name)
	){
		return {
			state: false,
			msg: 'task miss attribute'
		};
	}

	// defination必须定义
	if(!_.has(dslDef, 'defination')){
		return {
			state: false,
			msg: dslDef.name + '\'s miss defination'
		};
	}

	if(!_.isFunction(dslDef.defination)){
		return {
			state: false,
			msg: dslDef.name + '\'s input attribute must be a function'
		};
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

	// 若定义了conditions，则该项必须为数组
	if(_.has(dslDef, 'conditions')){
		if(!_.isArray(dslDef.conditions)){
			return {
				state: false,
				msg: dslDef.name + '\'s conditions attribute must be an array'
			};
		}
	}

	return {state: true};
};
