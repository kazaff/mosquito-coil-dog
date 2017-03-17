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
			codeString += 'result.' + name + '=JP.query($,`' + value + '`);';		// jspath解析
		}else if(_.startsWith(value, '"') || _.startsWith(value, "'")){
			codeString += 'result.' + name + '=' + value + ';';
		}else{
			codeString += 'result.' + name + '=_.get($, `' + value + '`);';
		}

		codeString += `
			}
		}else{
			result.` + name + `={error: 424, msg:'` + _.split(key, '.', 3)[2] + ` had not be ran'};
		}
		`;
	});

	if(_.has(dslDef, 'conditions')){
		codeString += '}';
	}

	codeString += '$.output.' + dslDef.name + '.data=result;';

	return codeString + `
		} catch (e) {
			if($.setting.error && $.setting.error.default){
   ` + '$.output.' + dslDef.name + '=$.setting.error.default;' + `
			}else{
	 ` + '$.output.' + dslDef.name + '={error:503, e.toString()};' + `
			}
		} finally {
			done();
		}
	}
	`;
};
