// 加载系统库
const fs = require('fs');
const Path = require('path');
// 定义相关路径
const APP_PATH = __dirname;
const CORE_PATH = APP_PATH + '/core';
const PLUGIN_PATH = APP_PATH + '/plugins';
const HANDLER_PATH = APP_PATH + '/compiled_services';
// 加载所有核心模块
const LoaderManager = require('./core/LoaderManager.js');
const Config = LoaderManager.load('Config', APP_PATH + '/config.js');// 载入配置文件
const PluginManager = LoaderManager.load('Core.PluginManager', CORE_PATH + '/PluginManager.js');	// 初始化插件管理器
LoaderManager.load('Core.WorkPoolManager', CORE_PATH + '/WorkPoolManager.js');	// 初始化工作池管理器
const EventManager = LoaderManager.load('Core.EventManager', CORE_PATH + '/EventManager.js');
const APIServerManager = LoaderManager.load('Core.APIServerManager', CORE_PATH + '/APIServerManager.js');
LoaderManager.load('Core.AdminServerManager', CORE_PATH + '/AdminServerManager.js');
LoaderManager.load('Core.ContextManager', CORE_PATH + '/ContextManager.js');
// 通过资源管理器加载默认类库
const _ = LoaderManager.get('Lodash');
const ExceptionManager = LoaderManager.get('ExceptionManager');

// TODO 初始化admin webserver

// 挂载所有的插件
if(_.isArray(Config.plugins)){
	_.forEach(Config.plugins, function(item){	// 按照配置文件中的顺序挂载插件
		let plugin = LoaderManager.load('Plugin.' + Path.basename(item), PLUGIN_PATH + item + '.js');
		PluginManager.apply(plugin);
	});

}else{
	throw ExceptionManager.factory.create('ConfigError', 'plugins node do not exist');
}

// 触发系统初始化事件(SYSTEM_BOOTSTRAP)，同步
PluginManager.applyPlugins(PluginManager.EVENTS.SYSTEM_BOOTSTRAP, LoaderManager);

// 注册服务处理逻辑
const ServiceContainer = {};	// 服务注册表容器
EventManager.on(EventManager.EVENTS.SERVICE_BIND, function(registrations){

	if(_.isNil(registrations)){
		return;
	}

	if(!_.isArray(registrations)){
		registrations = [registrations];
	}

	_.forEach(registrations, function(path){	// path由服务的type_method_name_version_priority组成, 对应"compiled_services"文件夹里的特定js文件
		// 有效性验证
		if(!_.isString(path) || !fs.existsSync(HANDLER_PATH + '/' + path + '.js')){
			//throw ExceptionManager.factory.create('ConfigError', 'service('+ path +') invalid');
			EventManager.emit(EventManager.EVENTS.SERVICE_BIND_FAIL, path);
		}

		let meta = _.split(path, '_');
		let domain = _.join(_.dropRight(meta), '_');	// 注册表中服务的key为：type_method_name_version

		meta = {
			type: meta[0],
			method: meta[1],
			name: meta[2],
			version: meta[3],
			priority: _.toNumber(meta[4])
		}

		// 唯一性验证
		if(_.has(ServiceContainer, domain)){
			throw ExceptionManager.factory.create('ConfigError', 'service domain('+ path +') conflict');
		}

		let handler = require(HANDLER_PATH + '/' + path + '.js');
		if(_.isFunction(handler)){	// handler必须为函数
			ServiceContainer[domain] = {meta, handler};
			EventManager.emit(EventManager.EVENTS.SERVICE_RUNNING, meta);
		}else{
			throw ExceptionManager.factory.create('ConfigError', 'service('+ path +')\'s handler is not a function');
		}
	});
});

// 初始化api webserver
APIServerManager.init(ServiceContainer);
