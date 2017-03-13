{	// 正式的dsl定义是不允许携带注释的，下面的注释只是方便理解
	"name": "example",	// 该工作流名称+版本号必须唯一
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
			"domain": "http://xxxx/xxxx/:a",	// url中的参数会使用input属性中的定义的值
			"body": {	// 该属性可以是对象，也可以是json字符串，若属性值以$.开头，则会进行jspath解析，若method为put或post，则必须包含body
				'b': "$.request.form",	//	若属性值以$.开头，则会进行jspath解析
			},
			"header": {
				"x-auth-token": "$.request.header['x-auth-token']"	// 根据历史原因，若没有声明这个请求头，MCDog也会自动为所有rest型任务添加该请求头
			},
			"input": {
				"a": "$.request.a"	// 值声明为jsonpath语法
			},
			"output": {	// 若没有声明该属性，则相当于任务得到的响应数据全部保留
				"total": "$.output.totalTask.total"
			},
			"timeout": 3000,	// 若不设置，则使用工作流默认的配置
			"retry": {
				"interval": 2000,
				"times": 2
			}
		},
		{
			"name": "listTask",
			"type": "rest",
			"method": "get",
			"domain": "//xxxx/xxxx/:a",	 // 地址中的参数默认MCDog会直接绑定请求中对应的变量，也可以在input中手动定义
			"input": {
				"a": "$.request.a",
				"num": "$.request.num",	// 会以querystring方式添加在domain中
			},
			"tasks": [	// 外层任务执行完后才会执行嵌套的任务
				{
					"name": "userTask",
					"type": "rest",
					"method": "get",
					"domain": "//xxxx/xxxx/:uids",
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
								"defination": function(input, output, done){	// 自定义函数会被MCDog封装到promise中，自定义函数体内不允许有setTimeout, setinterval, eval调用
									for(var i = 0, max = input.list.length; i < max; i++){
										for(var j = 0, inMax = input.users.length; j < inMax; j++){
											if(input.list[i].uid === input.users[j].id){
												input.list[i].username = input.users[j].name;	// 默认允许直接对上下文对象进行扩展
												break;
											}
										}
									}
									// input和output参数使用时避免对其进行重新赋值，以免数据丢失
									done();	// 必须回调该函数，否则会触发超时
								},
								"input": {
									"list": "$.output.listTask.list",	// 若jsonpath获取不到对应的值，则返回null
									"users": "$.output.userTask.users",
								}
							}
						}
				},
				{
					"name": "checkCodeTask",	// 任务名称在该工作流中必须唯一
					"type": "pass",
					"output": {	// 该类型的任务必须包含output定义
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
			"timout": 'xxxxxxxx'
			"default":'xxxxxxx'
		}
	}
}
