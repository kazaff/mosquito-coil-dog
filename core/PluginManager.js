const Loader = require('./LoaderManager.js');
const Tapable = Loader.get('Tapable');

function PluginManager(){
		Tapable.call(this);
}
PluginManager.prototype = Object.create(Tapable.prototype);

// 定义hooks，凡是标有“同步”的HOOK，暂时不推荐绑定任何异步逻辑，否则执行流可能非如你所愿
PluginManager.prototype.EVENTS = {
	SYSTEM_BOOTSTRAP: 'system_bootstrap',	// 系统初始化初期的HOOK，可用于加载依赖类库，同步 串行
	DSL_VALIDATE: 'dsl_validate', // dsl 合法性校验的HOOK
	DSL_PARSE: 'dsl_parse', // dsl 解析编译的HOOK
	SERVICE_ONLINE: 'task_online', 	// 服务上线
	SERVICE_OFFLINE: 'task_offline', 	// 服务下线
	STORAGE_SAVE: 'storage_save', // dsl 数据持久化的HOOK，用于将dsl等信息持久化到db，而dsl编译后的结果MCDog会创建对应的js文件存储在本地
	STORAGE_READ: 'storage_read', // 相关数据加载的HOOK，主要用于服务的状态的获取
	// 所有TASK_类型HOOK，都会传递任务的相关数据，如：context, handler, socket, etc
	TASK_CONTEXT_CREATE_AFTER: 'task_context_create_after', // 请求上下文实例创建的HOOK
	TASK_COMPLETE: 'task_complete', 	// 任务完成的HOOK，只用于做服务器端相关统计等逻辑，串行
};

module.exports = new PluginManager();
