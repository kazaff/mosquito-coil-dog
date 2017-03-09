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
	let Redis = require('redis');
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
		PluginManager.plugin(PluginManager.EVENTS.STORAGE_READ, function({Loader, query}, next) {
			let _ = Loader.get('Lodash');
			let db = _connectRedis(Loader);

			if(query.command === 'services'){
				db.multi()
					.hgetall('State')
					.hgetall('DSL')
					.exec(function(err, result){
						if(err){
							next(err);
						}else{

							// 数据合并
							let list = [];
							_.forOwn(result[1], function(dsl, path){
								let item = {
									path: path,
									dsl: dsl,
									state: parseInt(result[0][path])
								}

								list.push(item);
							});

							next(null, list);
						}
					});
			}else if(query.command === 'find'){
				db.hget('DSL', query.id, function(err, result){
					if(err){
						next(err);
					}else{
						next(null, result);
					}
				});
			}
    });

		PluginManager.plugin(PluginManager.EVENTS.STORAGE_SAVE, function({Loader, query}, next) {
			let _ = Loader.get('Lodash');
			let db = _connectRedis(Loader);

			if(query.command === 'delete'){
				db.multi()
				 	.hdel('State', query.id)
					.hdel('DSL', query.id)
					.exec(function(err, result){
						if(err){
							next(err);
						}else{
							// TODO 事务原子性保证
							next();
						}
					});
			}else if(query.command === 'change'){
				db.hmset('State', query.id, query.status, function(err){
					if(err){
						next(err);
					}else{
						next();
					}
				})
			}else if(query.command === 'save'){
				db.multi()
				 	.hmset('State', query.id, 0)
					.hmset('DSL', query.id, query.dsl)
					.exec(function(err, result){
						if(err){
							next(err);
						}else{
							// TODO 事务原子性保证
							next();
						}
					});
			}
    });
}

module.exports = new StoragerPlugin();
