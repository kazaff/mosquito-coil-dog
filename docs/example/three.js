{
	"name": 'three',
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
			output:{
				total: 'output.restTask.total'
			},
			tasks: [
				{
					name: 'passInnerTask',
					type: 'pass',
					output: {
						total: 'output.restTask.total',
						list: '$.output.restTask.users.*'
					}
				}
			]
		},
		{
			name: 'passOutTask',
			type: 'pass',
			output: {
				total: 'output.restTask.total',
				list: '$.output.restTask.users.*'
			}
		}
	],
	output: {
		passInner: 'output.passInnerTask.total',
		passOut: 'output.passOutTask.total'
	}
}
