module.exports = {
	"storage": {
		"host": "127.0.0.1",
		"port": 6379,
		"password": "",
		"db": 0,
		"prefix": "MCDog-"
	},
	"api_server": {
		"host": "127.0.0.1",
		"port": 2333,
		"concurrency": 1000,	// api对外提供处理请求的并发数
	},
	"admin_server": {
		"host": "127.0.0.1",
		"port": 2334,
		"user": "kz",
		"password": "123",
		"ifActive": true, 	// 可以不开启管理后台
	},
	"plugins": [	// 挂在相同HOOK的插件顺序很重要
		"/StartProcessPlugin",	// 自带的默认插件，用于输出ASCII logo
		"/StoragerPlugin",
		"/Analyzer/AnalyzerPlugin",
		"/TestPlugin",
	]
}
