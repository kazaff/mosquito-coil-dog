const Loader = require('./LoaderManager.js');
const Async = Loader.get('Async');

const Config = Loader.get('Config');

let WorkPoolManager = Async.priorityQueue(function(task, done){

	// 组装task（将context传入handle，并将处理结果返回给socket）
	task.handler(task.context, ()=>{
		// 处理请求响应（把output值放到body里）
		task.context.body = task.context.output;
		done();
	});

}, Config.api_server.concurrency);

module.exports = WorkPoolManager;
