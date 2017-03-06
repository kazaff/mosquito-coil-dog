const Loader = require('./LoaderManager.js');
const Config = Loader.get('Config');
const Koa = Loader.get('Koa');
const KoaRoute = Loader.get('KoaRoute');
const KoaCORS = Loader.get('KoaCORS');
const KoaBetterBody = Loader.get('KoaBetterBody');
const APIServer = new Koa();

let _ =Loader.get('Lodash');
let PluginManager = Loader.get('Core.PluginManager');
let WorkPoolManager = Loader.get('Core.WorkPoolManager');
let Promise = Loader.get('Promise');

// 跨域配置
APIServer.use(KoaCORS());
// 请求体解析
APIServer.use(KoaBetterBody());

let Services = null;	// 存储当前能上线状态的服务注册

let handler = function *(path){
	let context = this;
	context.output = {};

	// 请求上下文实例创建HOOK
	yield new Promise(function(resolve, reject){
		PluginManager.applyPluginsAsync(PluginManager.EVENTS.TASK_CONTEXT_CREATE_AFTER, context, (err)=>{
			err ? reject(err) : resolve();
		});
	});


	// 解析url参数，查找对应的服务handler
	let key = 'rest_' + _.toLower(context.method) + '_' + path + '_' + context.header.version;

	if(!_.isNil(Services[key])){
		let service = Services[key];
		// 将本次请求组装成task分派给工作池
		let task = {
			context: context,
			handler: service.handler,
		}

		// 注意这里写法，否则请求会直接结束
		yield new Promise(function(resolve, reject) {
			WorkPoolManager.push(task, service.meta.priority, (err)=>{	// 仅仅是为了结束请求，流程中的任何异常应该在handler中处理
				err ? reject(err) : resolve();

				// 请求完成HOOK, 这个HOOK不允许影响接口响应数据，只用于做服务器端相关统计等逻辑
				PluginManager.applyPluginsAsyncSeries(PluginManager.EVENTS.TASK_COMPLETE, context, (err)=>{
					// TODO 错误处理方式, 这里的异常不会返回给接口调用者
					if(err) console.error(err);
				});
			});
		});

	}else{
		// 异常处理
		context.throw(404, 'Service not exist');
	}
};

module.exports.init = function init(ServiceContainer){

	Services = ServiceContainer;

	// 暴露对外提供服务的入口
	let _ = Loader.get('Lodash');
	_.forEach(['get', 'post', 'put', 'del'], function(method){
		APIServer.use(KoaRoute[method]('/:path', handler));
	});

	APIServer.listen(Config.api_server.port, Config.api_server.host);
};
