/*
	该插件负责MCDog的数据持久化及查询，它选用的是Redis作为DB，若有需要可以替换成任何你需要的数据库。
	该插件会在Redis中创建2个Hash结构的容器:
		- MCDog-DSL: 用于保存服务定义DSL
		- MCDog-State: 用于保存服务的状态
*/

let RedisClient = null;

function _connectRedis(Loader){
	if(RedisClient !== null){
		return RedisClient;
	}

	let ExceptionManager = Loader.get('ExceptionManager');

	// 创建redis连接
	let Redis = Loader.load('Redis', 'redis');
	let Config = Loader.get('Config');
	RedisClient = Redis.createClient({
		host: Config.storage.host,
		port: Config.storage.port,
		db: Config.storage.db,
		prefix: Config.storage.prefix,
		//password: Config.storage.password,
		retry_strategy: function(options){
			if (options.error && options.error.code === 'ECONNREFUSED'){
				return ExceptionManager.factory.create('StorageError', 'The server refused the connection');
			}
			if (options.total_retry_time > 1000 * 60 * 60) {
				return ExceptionManager.factory.create('StorageError', 'Retry time exhausted');
      }
			if (options.times_connected > 10) {
        // End reconnecting with built in error
        return undefined;
      }
			// reconnect after
      return Math.min(options.attempt * 100, 3000);
		}
	});
	RedisClient.unref();

	return RedisClient;
}

function StoragerPlugin() {}
StoragerPlugin.prototype.apply = function(PluginManager) {
    PluginManager.plugin(PluginManager.EVENTS.SYSTEM_BOOTSTRAP, function(Loader) {
			let _ = Loader.get('Lodash');
			let EventManager = Loader.get('Core.EventManager');
			let db = _connectRedis(Loader);

			// 用于系统初始化后载入处于激活状态的服务
			let registrations = [];
			db.hgetall('State', function(error, result){
				_.forOwn(result, function(state, path){
					if(parseInt(state) > 0){
						registrations.push(path);	// path由服务的type_method_name_version_priority组成, 对应"compiled_services"文件夹里的特定js文件
					}
				});

				EventManager.emit(EventManager.EVENTS.SERVICE_BIND, registrations);
			});
    });

		PluginManager.plugin(PluginManager.EVENTS.STORAGE_READ, function(Loader) {
			// TODO
    });

		PluginManager.plugin(PluginManager.EVENTS.STORAGE_SAVE, function(Loader) {
			// TODO
    });
}

module.exports = new StoragerPlugin();
