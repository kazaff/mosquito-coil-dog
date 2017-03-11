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

	// 不能包含tasks定义
	if(_.has(dslDef, 'tasks')){
		return {
			state: false,
			msg: dslDef.name + ' must not have the \'tasks\' attribute'
		};
	}


	if(!_.has(dslDef, 'output')){
		return {
			state: false,
			msg: dslDef.name + '\'s output attribute must include output attribute'
		};
	}

	if(!_.isPlainObject(dslDef.output)){
		return {
			state: false,
			msg: dslDef.name + '\'s output attribute must be an object'
		};
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
