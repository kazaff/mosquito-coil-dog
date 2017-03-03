var EventEmitter = require('events');

class EventManager extends EventEmitter{
	get EVENTS(){
		return {
			SERVICE_BIND: 'service_bind',	 // 注册新的服务处理逻辑
			SERVICE_RUNNING: 'service_running',		// 新服务上线事件
			SERVICE_BIND_FAIL: 'service_bind_fail', // 服务注册失败，通常由对应的服务js文件不存在造成
		}
	}
}

module.exports = new EventManager();
