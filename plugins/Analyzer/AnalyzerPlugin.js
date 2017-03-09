const Fs = require('fs');

function AnalyzerPlugin() {}
AnalyzerPlugin.prototype.apply = function(PluginManager) {
	// DSL校验HOOK
	PluginManager.plugin(PluginManager.EVENTS.DSL_VALIDATE, function({Loader, dslDef}, next) {
		let _ = Loader.get('Lodash');

		next(null, function validate(dsl, type){

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
				// 串行({})还是并行([])
				_.forEach(dsl.tasks, function(task){
					return result = validate(task, _.capitalize(task.type));
				});
			}

			return result;

		}(dslDef, 'Outlayer'));

  });
}

module.exports = new AnalyzerPlugin();
