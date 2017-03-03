// 加载MCDog依赖的第三方类库
const Lodash = require('lodash');
const Koa = require('koa');
const KoaRoute = require('koa-route');
const KoaCORS = require('koa-cors');
const KoaBetterBody = require('koa-better-body');
const Async = require('async');
const Promise = require('bluebird');
const Request = require('request');
const Tapable = require('tapable');
const RestURL = require('rest-url');
const JsonPath = require('jsonpath');

const ExceptionManager = require('./ExceptionManager.js');

let resources = {
	Lodash, Koa, KoaRoute, KoaCORS, KoaBetterBody, Async, Promise, Request, Tapable, RestURL, JsonPath, ExceptionManager
};

class Loader{

	load(name, path){	// TODO 路径相对位置
		if(resources[name])	// TODO 这里限制了重名的库
			return;

		return resources[name] = require(path);
	}

	get(name){
		let target;
		if(target = resources[name])
			return target;

		throw ExceptionManager.factory.create('LoaderError', name + ' lib are not exist!');
	}
}

module.exports = new Loader();
