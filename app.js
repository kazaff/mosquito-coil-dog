// 加载系统库
const Fs = require('fs');
const Path = require('path');
const Walkdir = require('walkdir');
// 定义相关路径
const APP_PATH = __dirname;
const CORE_PATH = APP_PATH + '/core';
const PLUGIN_PATH = APP_PATH + '/plugins';
const HANDLER_PATH = APP_PATH + '/compiled_services';
// 加载所有核心模块
const LoaderManager = require('./core/LoaderManager.js');
const Config = LoaderManager.load('Config', APP_PATH + '/config.js');// 载入配置文件
const PluginManager = LoaderManager.load('Core.PluginManager', CORE_PATH + '/PluginManager.js');	// 初始化插件管理器
const WorkPoolManager = LoaderManager.load('Core.WorkPoolManager', CORE_PATH + '/WorkPoolManager.js');	// 初始化工作池管理器
const APIServerManager = LoaderManager.load('Core.APIServerManager', CORE_PATH + '/APIServerManager.js');
const AdminServerManager =LoaderManager.load('Core.AdminServerManager', CORE_PATH + '/AdminServerManager.js');
LoaderManager.load('Core.ContextManager', CORE_PATH + '/ContextManager.js');
// 通过资源管理器加载默认类库
const _ = LoaderManager.get('Lodash');
const ExceptionManager = LoaderManager.get('ExceptionManager');

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
PluginManager.applyPlugins(PluginManager.EVENTS.SYSTEM_BOOTSTRAP, LoaderManager, Config);

// 注册服务处理逻辑
const ServiceContainer = {};	// 服务注册表容器
// 扫描插件文件夹，依次加载相关服务
Walkdir.sync(HANDLER_PATH, {no_recurse: true}, function(path, stat){

	if(Path.extname(path) !== '.js'){
		return;
	}
	// path由服务的type_method_name_version_priority组成
	let filename = Path.basename(path, '.js');
	let meta = _.split(filename, '_');
	let domain = _.join(_.dropRight(meta), '_');	// 注册表中服务的key为：type_method_name_version

	meta = {
		type: meta[0],
		method: meta[1],
		name: meta[2],
		version: meta[3],
		priority: _.toNumber(meta[4])
	}

	// 唯一性验证
	if(_.has(ServiceContainer, domain) && !_.isNull(ServiceContainer[service])){
		throw ExceptionManager.factory.create('ConfigError', 'service domain('+ filename +') conflict');
	}

	let handler = require(path);
	if(_.isFunction(handler)){	// handler必须为函数
		ServiceContainer[domain] = {meta, handler};
	}else{
		throw ExceptionManager.factory.create('ConfigError', 'service('+ path +')\'s handler is not a function');
	}
});

// 服务上线
PluginManager.plugin(PluginManager.EVENTS.SERVICE_ONLINE, function({Loader, filename}, next) {

	// 获取dsl声明
	let query = {
		command: 'find',
		id: filename
	};

	PluginManager.applyPluginsAsyncWaterfall(PluginManager.EVENTS.STORAGE_READ, {Loader, query}, (err, dslString)=>{

		if(err) return next(err);
		try{

			if(_.isNil(dslString)){
				return next({msg:'service do not exist'});
			}

			let dslDef = eval('(' + dslString + ')');	// 解析js字符串

			// 有效性检查
			PluginManager.applyPluginsAsyncWaterfall(PluginManager.EVENTS.DSL_VALIDATE, {Loader, dslDef}, (err, result)=>{
				if(err || result.state === false){
					next(err, result);
				}else{
					// 解析
					PluginManager.applyPlugins(PluginManager.EVENTS.DSL_PARSE, {Loader, dslDef}, function(err, codeString){
						if(err || _.isEmpty(codeString)){
							next(err, {state:false, msg: 'parse error'});
							return;
						}

						let meta = _.split(filename, '_');
						let domain = _.join(_.dropRight(meta), '_');	// 注册表中服务的key为：type_method_name_version
						let path = HANDLER_PATH + '/' + filename + '.js';
						// 生成js文件
						Fs.writeFileSync(path, codeString);
						// 服务注册
						delete require.cache[require.resolve(path)]; // 避免之前缓存
						let handler = require(path);
						ServiceContainer[domain] = {meta, handler};
						next(null, {state:true});
					});
				}
			});
		}catch(e){
			next(e);
		}
	});
});

// 服务解绑 + 文件删除
PluginManager.plugin(PluginManager.EVENTS.SERVICE_OFFLINE, function({Loader, filename}, next) {
	let meta = _.split(filename, '_');
	let domain = _.join(_.dropRight(meta), '_');	// 注册表中服务的key为：type_method_name_version
	let path = HANDLER_PATH + '/' + filename + '.js';

	ServiceContainer[domain] = null;

	if(Fs.existsSync(path)){
		delete require.cache[require.resolve(path)];// 移除已加载的代码
		Fs.unlinkSync(path);// 删除文件
	}


	next();
});

// 初始化api webserver
APIServerManager.init(ServiceContainer);

// 初始化admin webserver
if(Config.admin_server.ifActive){
	AdminServerManager.init(HANDLER_PATH);
}

// 配合pm2进行优雅重启
process.on('SIGINT', function(){
	// 停机HOOK
	PluginManager.applyPlugins(PluginManager.EVENTS.SYSTEM_SHUTDOWN, LoaderManager, Config);
	// 解绑所有已上线服务
	_.forOwn(ServiceContainer, function(value, key){
		ServiceContainer[key] = null;
	});

	setInterval(function(){
		// 检查工作池是否为空
		if(WorkPoolManager.idle()){
			process.exit(0);
		}
	}, 2000);
});
