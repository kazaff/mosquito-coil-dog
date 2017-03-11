let _ = require('lodash');
let U2 = require('uglify-js');

module.exports = function(dslDef){
	if( !_.isPlainObject(dslDef)
			|| !_.has(dslDef, 'name') || !_.isString(dslDef.name)
	){
		return {
			state: false,
			msg: 'task miss attribute'
		};
	}

	if(_.has(dslDef, 'tasks')){
		if(!_.isPlainObject(dslDef.tasks) && !_.isArray(dslDef.tasks)){
			return {
				state: false,
				msg: dslDef.name + '\'s tasks attribute invalid'
			};
		}
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

	// 自定义函数不允许包含的关键字：setTimeout, setinterval, eval, function
	let ifErr = false;
	try {
		let ast = U2.parse('var tmp=' + dslDef.defination.toString());
		ast.figure_out_scope();

		ast.walk(new U2.TreeWalker(function(node){
		  if (node instanceof U2.AST_Call
		      && (node.expression.print_to_string() === 'setTimeout' || node.expression.print_to_string() === 'setTimeout' || node.expression.print_to_string() === 'setinterval' || node.expression.print_to_string() === 'eval')
				){
					ifErr = true;
		  }
		}));
	} catch (e) {
		return {
			state: false,
			msg: dslDef.name + '\'s defination attribute is an invalid function'
		};
	}

	if(ifErr){
		return {
			state: false,
			msg: dslDef.name + '\'s defination attribute must be a safe function'
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

	// 不允许定义了output
	if(_.has(dslDef, 'output')){
		return {
			state: false,
			msg: dslDef.name + '\' must not define the output attribute'
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
