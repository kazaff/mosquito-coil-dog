const Loader = require('./LoaderManager.js');
const Tapable = Loader.get('Tapable');

function PluginManager(){
		Tapable.call(this);
}
PluginManager.prototype = Object.create(Tapable.prototype);

// 定义hooks
PluginManager.prototype.EVENTS = {
	SYSTEM_BOOTSTRAP: 'system_bootstrap',	// 系统初始化初期HOOK，同步串行
	DSL_VALIDATE: 'dsl_validate', // dsl 合法性校验HOOK
	DSL_PARSE: 'dsl_parse', // dsl 解析编译HOOK
	STORAGE_SAVE: 'storage_save', // dsl 数据持久化HOOK，用于将dsl等信息持久化到db，而dsl编译后的结果MCDog会创建对应的js文件存储在本地
	STORAGE_READ: 'storage_read', // 相关数据加载HOOK，主要用于服务的状态，名称，版本号等数据的获取
	SERVICE_START_BEFOR: 'service_start_befor',	// 开始提供服务之前的HOOK，可用于加载依赖类库
	// 所有TASK_类型HOOK，都会传递任务的相关数据，如：context, handler, socket, etc
	TASK_CONTEXT_CREATE_AFTER: 'task_context_create_after', // 请求上下文实例创建HOOK
	TASK_DISPATCH_BEFOR: 'task_dispatch_befor',	// 任务投递前HOOK
	TASK_DISPATCH_AFTER: 'task_dispatch_after', // 任务投递后HOOK
	TASK_COMPLETE: 'task_complete', 	// 任务完成HOOK
};

module.exports = new PluginManager();
