const Loader = require('./LoaderManager.js');
const Async = Loader.get('Async');

const Config = Loader.get('Config');

let WorkPoolManager = Async.priorityQueue(function(task, done){

	// 组装task（将context传入handle，并将处理结果返回给socket）
	task.handler(task.context, (error)=>{
		// 处理请求响应（把output值放到body里）
		task.context.body = task.context.output.data;
		
		// TODO 异常日志，这部分以后可用在服务可用性监控上
		if(error)
			console.error(error);

		done();
	});

}, Config.api_server.concurrency);

module.exports = WorkPoolManager;
