const Loader = require('./LoaderManager.js');
const Async = Loader.get('Async');

const Config = Loader.get('Config');

let WorkPoolManager = Async.priorityQueue(function(task, done){

	// TODO 组装task（将context传入handle，并将处理结果返回给socket）
	task.handler(task.context);
	done();

}, Config.api_server.concurrency);

module.exports = WorkPoolManager;
