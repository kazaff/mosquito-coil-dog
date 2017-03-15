let _ = require('lodash');

module.exports = function(dslDef){
	let codeString = `
		function($, done){
			var result = {};
			$.output.` + dslDef.name + `={};
			try{
	`;

	if(_.has(dslDef, 'conditions')){
		codeString += 'if(' + dslDef.conditions.join(' && ') + '){';
	}

	_.forOwn(dslDef.output, function(value, name){
		let key;
		if(_.startsWith(value, '$')){
			key = _.join(_.split(value, '.', 3),'.');
		}else{
			key = '$.' + _.join(_.split(value, '.', 2),'.');
		}

		codeString += `if(`+ key +`.error){
			result.` + name + `=` + key + `.error;
		}else{
		`;
		if(_.startsWith(value, '$.output.')){
			codeString += 'result.' + name + '=JP.query($,`' + value + '`);';		// jspath解析
		}else if(_.startsWith(value, '"') || _.startsWith(value, "'")){
			codeString += 'result.' + name + '=' + value + ';';
		}else{
			codeString += 'result.' + name + '=$.' + value + ';';
		}
		codeString += '}';
	});

	if(_.has(dslDef, 'conditions')){
		codeString += '}';
	}

	codeString += '$.output.' + dslDef.name + '=result;';

	return codeString + `
		} catch (e) {
			if($.setting.error && $.setting.error.default){
   ` + '$.output.' + dslDef.name + '.error=$.setting.error.default;' + `
			}else{
	 ` + '$.output.' + dslDef.name + '.error=e.toString();' + `
			}
		} finally {
			done();
		}
	}
	`;
};
