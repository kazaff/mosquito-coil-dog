{
	"name": 'two',
	version: 1,
	priority: 1,
	description: '测试rest任务+if+timeout+retry',
	type: "rest",
	method: 'get',
	"tasks": [
		{
			name: "restTask",
			type: 'Rest',
			method: "Get",
			"domain": 'http://127.0.0.1:3000/',
			input: {
				v: "request.query.id"
			},
			conditions: ['input.v > 0'],
			timeout: 1500,
			retry:{
				times: 1,
				interval: 2000
			},
			tasks: {
				"pass1Task": {
					type: 'pass',
					output: {
						'fromRest': '$.output.restTask.users[?(@.id!=2)]',
						list: '$.output.restTask.users.*'
					}
				}
			}
		}
	]
}
