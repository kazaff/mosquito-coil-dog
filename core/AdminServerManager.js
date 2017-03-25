const Loader = require('./LoaderManager.js');
const Config = Loader.get('Config');
const Koa = Loader.get('Koa');
const BasicAuth = require('koa-http-auth').Basic
const KoaRoute = Loader.get('KoaRoute');
const KoaCORS = Loader.get('KoaCORS');
const KoaBetterBody = Loader.get('KoaBetterBody');
const Fs = require('fs');
const SafeEval = require('notevil');

let _ =Loader.get('Lodash');
let PluginManager = Loader.get('Core.PluginManager');
let Promise = Loader.get('Promise');

const AdminServer = new Koa();
// 跨域配置
AdminServer.use(KoaCORS());
// 认证配置
AdminServer.use(BasicAuth('MCDog'));
AdminServer.use(function * (next) {
  if (this.request.auth == null) { // No authorization provided
    this.body = 'Please log in.';
    return; // Middleware will auto give 401 response
  }

  if (this.request.auth.user !== Config.admin_server.user ||
    !this.request.auth.password(Config.admin_server.password)) {
    this.body = 'Invalid user.';
    delete this.request.auth; // Delete request.auth ...
    return; // ... will make middleware give 401 response too.
  }

  yield next;
});
// 请求体解析
AdminServer.use(KoaBetterBody());

module.exports.init = function init(HANDLER_PATH){

	// 服务列表
	AdminServer.use(KoaRoute.get('/services', function *(){
		// 读取db中对应的服务及状态
		let Context = this;
		let query = {
			command: 'services'
		};
		yield new Promise(function(resolve, reject){
			PluginManager.applyPluginsAsyncWaterfall(PluginManager.EVENTS.STORAGE_READ, {Loader, query}, (err, data)=>{
				if(err){
					// TODO 异常处理
					Context.status = 422;
					Context.body = err;
				}else{
					Context.body = data;
				}
				resolve();
			});
		});
	}));

	// 服务上下线
	AdminServer.use(KoaRoute.put('/service/:filename/:status', function *(filename, status){
		let Context = this;
		status = parseInt(status);

		if(status === 1){	// 服务上线

			yield new Promise(function(resolve, reject){
				PluginManager.applyPluginsAsyncWaterfall(PluginManager.EVENTS.SERVICE_ONLINE, {Loader, filename}, (err, result)=>{
					if(err || result.state !== true){	// 没有明确返回true就说明没有通过校验
						// 异常处理
						Context.status = 422;
						Context.body = err || result.msg;
					}
					resolve();
				});
			});

		}else if(status === 0){	// 服务下线
			yield new Promise(function(resolve, reject){
				PluginManager.applyPluginsAsyncWaterfall(PluginManager.EVENTS.SERVICE_OFFLINE, {Loader, filename}, (err, result)=>{
					if(err){
						// 异常处理
						Context.status = 422;
						Context.body = err || result.msg;
					}
					resolve();
				});
			});
		}

		// 失败处理
		if(Context.status === 422){
			return;
		}

		// 修改db中对应的状态
		let query = {
			command: 'change',
			id: filename,
			status: status
		};
		yield new Promise(function(resolve, reject){
			PluginManager.applyPluginsAsyncWaterfall(PluginManager.EVENTS.STORAGE_SAVE, {Loader, query}, (err, data)=>{
				if(err){
					// 异常处理
					Context.status = 422;
					Context.body = err;
				}else{
					Context.status = 200;
					Context.body = '';	// 占位符
				}
				resolve();
			});
		});
	}));

	// 保存服务：将dsl存储到db中，并创建对应状态值为下线
	AdminServer.use(KoaRoute.post('/services', function *(){
		// 将dsl存储到db中，并创建对应状态值为下线
		let Context = this;

		// 请求body不允许为空
		if(_.isUndefined(Context.request.body)){
			Context.status = 422;
			Context.body = 'dsl format error';
			return;
		}

		let dslString = Context.request.body;	// 去掉所有制表符

		try {
			SafeEval('(' + dslString + ')');	// 解析js字符串，检查是否存在语法错误
		} catch (err) {
			Context.status = 422;
			Context.body = 'DSL ' + err.toString();
			return;
		}

		let dslDef = eval('(' + dslString + ')');	// 解析js字符串

		try{
			// dsl有效性校验逻辑
			yield new Promise(function(resolve, reject){
				PluginManager.applyPluginsAsyncWaterfall(PluginManager.EVENTS.DSL_VALIDATE, {Loader, dslDef}, (err, result)=>{
					if(err || result.state !== true){	// 没有明确返回true就说明没有通过校验
						// 异常处理
						Context.status = 422;
						Context.body = err || result.msg;
					}
					resolve();
				});
			});

			if(Context.status === 422){
				return;
			}

			let key = dslDef.type + '_' + dslDef.method + '_' + dslDef.name + '_' + dslDef.version + '_' + dslDef.priority;
			let query = {
				command: 'find',
				id: key
			};

			// 检查服务是否已存在
			yield new Promise(function(resolve, reject){
				PluginManager.applyPluginsAsyncWaterfall(PluginManager.EVENTS.STORAGE_READ, {Loader, query}, (err, hasExist)=>{
					if(err){
						// 异常处理
						Context.status = 409;
						Context.body = err;
					}else{
						if(hasExist){
							Context.status = 409;
							Context.body = 'service has been exist';
						}
					}
					resolve();
				});
			});

			if(Context.status === 409){
				return;
			}

			// 保存服务
			query = {
				command: 'save',
				id: key,
				dsl: dslString
			};

			yield new Promise(function(resolve, reject){
				PluginManager.applyPluginsAsyncWaterfall(PluginManager.EVENTS.STORAGE_SAVE, {Loader, query}, (err, data)=>{
					if(err){
						// 异常处理
						Context.status = 500;
						Context.body = err;
					}else{

						Context.status = 200;
						Context.body = '';	// 占位符
					}
					resolve();
				});
			});

		}catch(err){
			Context.status = 422;
			Context.body = err.toString();
		}
	}));

	// 删除服务
	AdminServer.use(KoaRoute.del('/service/:path', function *(path){
		// 将dsl从db中删除，成功后删除文件夹中对应js文件
		let Context = this;
		let query = {
			command: 'delete',
			id: path
		};
		yield new Promise(function(resolve, reject){
			PluginManager.applyPluginsAsyncWaterfall(PluginManager.EVENTS.STORAGE_SAVE, {Loader, query}, (err)=>{
				if(err){
					// 异常处理
					Context.status = 500;
					Context.body = err;
				}else{

					// 清理对应文件
					if(Fs.existsSync(HANDLER_PATH + '/' + path + '.js'))
						Fs.unlinkSync(HANDLER_PATH + '/' + path + '.js');

					Context.status = 200;
					Context.body = '';	// 占位符
				}
				resolve();
			});
		});
	}));

	// 管理后台帐号认证，仅仅是为了前端请求用，请求能执行到这里就已经意味着basic认证已通过
	AdminServer.use(KoaRoute.post('/login', function *(){
		this.body = '';
	}));

	AdminServer.listen(Config.admin_server.port, Config.admin_server.host);
};
