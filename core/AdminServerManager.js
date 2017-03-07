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
					reject(err);
				}else{

					Context.body = data;
					resolve();
				}
			});
		});
	}));

	// 服务上下线
	AdminServer.use(KoaRoute.put('/service/:filename/:status', function *(filename, status){
		let Context = this;
		status = parseInt(status);

		if(status === 1){	// 服务上线

			// TODO TODO TODO 有效性检查 + 解析生成js文件 + 服务绑定

		}else if(status === 0){	// 服务下线
			yield new Promise(function(resolve, reject){
				PluginManager.applyPluginsAsyncWaterfall(PluginManager.EVENTS.SERVICE_OFFLINE, {Loader, filename}, (err)=>{
					if(err){
						// TODO 异常处理
						reject(err);
					}else{
						resolve();
					}
				});
			});
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
					// TODO 异常处理
					reject(err);
				}else{

					Context.state = 200;
					Context.body = '';	// 占位符
					resolve();
				}
			});
		});
	}));

	// 保存服务：将dsl存储到db中，并创建对应状态值为下线
	AdminServer.use(KoaRoute.post('/services', function *(){
		// 将dsl存储到db中，并创建对应状态值为下线
		let Context = this;

		// 请求body不允许为空
		if(_.isUndefined(Context.request.body)){
			Context.state = 422;
			Context.body = 'dsl format error';
			return;
		}

		let dslString = Context.request.body.replace(/\n|\r|\t/g,"");	// 去掉所有制表符
		try{
			let dslDef = SafeEval('(' + dslString + ')');	// 解析js字符串

			// 检查服务定义必填项 TODO TODO TODO dsl有效性校验逻辑
			if( _.isPlainObject(dslDef)
					|| !_.has(dslDef, 'name') || !_.isString(dslDef.name)
					|| !_.has(dslDef, 'version') || !_.isNumber(dslDef.version)
					|| !_.has(dslDef, 'priority') || !_.isNumber(dslDef.priority)
					|| !_.has(dslDef, 'type')	|| !_.isString(dslDef.type)
					|| !_.has(dslDef, 'method')	|| !_.isString(dslDef.method)
			){
				Context.state = 422;
				Context.body = 'dsl format error';
				return;
			}

			let key = dslDef.type + '_' + dslDef.method + '_' + dslDef.name + '_' + dslDef.version + '_' + dslDef.priority;
			let query = {
				command: 'find',
				id: key
			}
			// 检查服务是否已存在
			yield new Promise(function(resolve, reject){
				PluginManager.applyPluginsAsyncWaterfall(PluginManager.EVENTS.STORAGE_READ, {Loader, query}, (err, hasExist)=>{
					if(err){
						// TODO 异常处理
						reject(err);
					}else{
						if(hasExist){
							Context.state = 409;
							Context.body = 'service has been exist';
						}
						resolve();
					}
				});
			});

			if(Context.state === 409){
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
						// TODO 异常处理
						reject(err);
					}else{

						Context.state = 200;
						Context.body = '';	// 占位符
						resolve();
					}
				});
			});

		}catch(err){
			console.log(err);
			Context.state = 422;
			Context.body = 'dsl format error';
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
					// TODO 异常处理
					reject(err);
				}else{

					// 清理对应文件
					if(Fs.existsSync(HANDLER_PATH + '/' + path + '.js'))
						Fs.unlinkSync(HANDLER_PATH + '/' + path + '.js');

					Context.state = 200;
					Context.body = '';	// 占位符
					resolve();
				}
			});
		});
	}));

	AdminServer.listen(Config.admin_server.port, Config.admin_server.host);
};
