const Fs = require('fs');

function AnalyzerPlugin() {}
AnalyzerPlugin.prototype.apply = function(PluginManager) {
	// DSL校验HOOK
	PluginManager.plugin(PluginManager.EVENTS.DSL_VALIDATE, function({Loader, dslDef}, next) {
		let _ = Loader.get('Lodash');
		let namespaces = {};
		next(null, function validate(dsl, type, namespaces){

			if(namespaces[dsl.name]){
				return {
					state: false,
					msg: dsl.name + ' name conflict'
				};
			}

			namespaces[dsl.name] = 1;

			let result = {
				state: false,
				msg: 'without rhyme or reason'
			};

			let path = __dirname + '/Validator/' + type + 'Validator.js';	// 根据任务类型查找对应的校验器
			if(Fs.existsSync(path)){
				result = require(path)(dsl);
			}else{
				return {	// 若不存在对应类型的校验器，则直接忽略该任务的校验（包括其子任务）
					state: true
				};
			}

			if(result.state === false){		// 如果该类型自身校验不通过，就直接返回，不需要再递归检查其可能存在的子任务（由外至内）
				return result;
			}

			if(_.has(dsl, 'tasks')){

				let isSeries = false;
				// 若串行({})，则需要将key赋给任务的name
				if(!_.isArray(dsl.tasks)){
					isSeries = true;
				}

				_.forEach(dsl.tasks, function(task, key){
					if(isSeries){task.name = key;}
					result = validate(task, _.capitalize(task.type), namespaces);
					return result.state;
				});
			}

			return result;

		}(dslDef, 'Outlayer', namespaces));

  });


	// DSL解析HOOK
	PluginManager.plugin(PluginManager.EVENTS.DSL_PARSE, function({Loader, dslDef}, next) {
		let _ = Loader.get('Lodash');

		// 递归解析任务
		next(null, function parse(dsl, type){
			let path = __dirname + '/Parser/' + type + 'Parser.js';	// 根据任务类型查找对应的解析器
			if(!Fs.existsSync(path)){	// 若不存在对应类型的校验器，则直接忽略该任务的解析（包括其子任务）
				return `
					function($, done){
						$.output.` + dsl.name + `={error:"task'type is not defined"};
						done();
					}
				`;
			}
			// 若该任务包含子任务，则先解析子任务(由内至外)
			var tasks = {};	// 对于串行任务，必须保证其顺序
			if(_.has(dsl, 'tasks')){
				_.forEach(dsl.tasks, function(task, key){
					tasks[key] = parse(task, _.capitalize(task.type));
				});
			}

			return require(path)(dsl, tasks);

		}(dslDef, 'Outlayer'));
	});
}

module.exports = new AnalyzerPlugin();
