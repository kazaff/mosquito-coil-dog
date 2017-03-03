{
	"workflow": "example",	// 该工作流名称+版本号必须唯一
	"version": 0.1,	// 版本号参数需要在请求头中携带对应的参数
	"priority": 0, // 接口处理优先级，范围0-9
	"description": "",	// 工作流描述
	"type": "rest",		// 暂时对外只提供rest协议
	"method": "get",
	"tasks": [		// []表示其中定义的任务以并发方式执行
		{
			"name": "totalTask",	// 任务名称在该工作流中必须唯一
			"type": "rest",
			"method": "get",
			"location": "//xxxx/xxxx/{:a}",	// url中的参数会使用input属性中的定义的值
			"header": {
				"x-auth-token": "$.request.header.auth-token"	// 根据历史原因，若没有声明这个请求头，MCDog也会自动为所有rest型任务添加该请求头
			}
			"input": {
				"a": "$.request.a"	// 值声明为jsonpath语法
			},
			"output": {	// 若没有声明该属性，则相当于任务得到的响应数据全部保留
				"total": "$.output.totalTask.total"
			},
			"timeout": 3000,	// 若不设置，则使用工作流默认的配置
			"retry": [
				{
					"match": ["States.Timeout"],	// MCDog提供了常见异常类型，根据类型可以做匹配筛选
					"interval": 2000,
					"max": 2,
					"backoff": 1.5
				},
				{
					"match": ["States.ALL"],	// States.ALL 表示匹配所有错误类型
					// 没有其它设置则表示不进行retry
				}
			],
		},
		{
			"name": "listTask",
			"type": "rest",
			"method": "get",
			"location": "//xxxx/xxxx/{:a}?page={:num}&sort={:column}",
			"input": {
				"a": "$.request.a",
				"num": "$.request.num",
				"column": "$.request.column"
			},
			"tasks": [	// 外层任务执行完后才会执行嵌套的任务
				{
					"name": "userTask",
					"type": "rest",
					"method": "get",
					"location": "//xxxx/xxxx/{:uids}",
					"input": {
						"uids": "$.output.listTask.list[*].uid"
					},
					"tasks": {		// {}表示其中定义的任务以串行方式执行
						"mergeTask": {
								"conditions": [	// 条件属性相当于if...else...或switch...case语法
									"list.length > 0",
									"users.length > 0"
								],
								"type": "function",
								"defination": function(){	// 自定义函数会被MCDog封装到promise中，最后一个入参done接受一个参数：err
									// 暂时不支持使用第三方类库，所以自定义函数体尽可能使用js原生语法，当然，MCDog会把常用的第三方库预置在全局对象中，例如：lodash, moment等
									// 也可以通过框架插件机制将自己需要的第三方类库在MCDog初始化是加入全局对象中

									// todo jsonpath解析时不支持函数定义携带任何参数，否则会报解析错误
									var input = arguments[0];
									var output = arguments[1];
									var done = arguments[2];
									for(var i = 0, max = in.list.length; i < max; i++){
										for(var j = 0, inMax = in.users.length; j < inMax; j++){
											if(in.list[i].uid === in.users[j].id){
												in.list[i].username = in.users[j].name;	// 默认允许直接对上下文对象进行扩展
												break;
											}
										}
									}
									done();	// 必须回调该函数，否则会触发超时
								},
								"input": {
									"list": "$.output.listTask.list",	// 若jsonpath获取不到对应的值，则返回null
									"users": "$.output.userTask.users",
								}
							}
						}
					}
				},
				{
					"name": "checkCodeTask",	// 任务名称在该工作流中必须唯一
					"type": "pass",
					"output": {	// 若不设置该属性，则会将输入参数原封不动返回，输入参数默认是上一层任务的输出数据
						"checkCode": "$.request.checkCode"
					}
				}
			]
		}
	],
	"output": {	// 工作流最外成定义的output将决定最终的响应数据，若不提供该属性，则会将上下文中的output节点下的全部数据返回
		"total": "$.output.totalTask.total",
		"list": "$.output.listTask.list"
	},
	"setting": {
		"timeout": 5000,	// 若该工作流没有默认配置，则使用MCDog提供的对一个设置
		"error": {	// 定义该工作流中所有任务的异常默认返回数据，若不设置，则将任务的异常结果原样输出
			"timout": {
				"code": 500,
				"message": "timeout"
			},
			"default": {
				"code": 500,
				"message": "X error"
			}
		}
	}
}
