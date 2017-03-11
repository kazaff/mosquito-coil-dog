let _ = require('lodash');

module.exports = function(dslDef){
	let codeString = `
		function($, done){
			var result = {};
			try{
	`;

	if(_.has(dslDef, 'conditions')){
		codeString += 'if(' + dslDef.conditions.join(' && ') + '){';
	}

	_.forOwn(dslDef.output, function(value, name){
		if(_.startsWith(value, '$.')){
			codeString += 'result.' + name + '=JP.query($,\'' + value + '\');';		// jspath解析
		}else{
			codeString += 'result.' + name + '=' + value + ';';
		}
	});

	if(_.has(dslDef, 'conditions')){
		codeString += '}';
	}

	codeString += '$.output.' + dslDef.name + '=result;';

	return codeString + `
		} catch (e) {
	` + '$.output.' + dslDef.name + '=e;' + `
		} finally {
			done();
		}
	}
	`;
};
