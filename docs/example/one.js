{
	"name": 'one',
	version: 1,
	priority: 1,
	description: '测试rest任务+if+sonTask use series',
	type: "rest",
	method: 'get',
	"tasks": [
		{
			name: "restTask",
			type: 'Rest',
			method: "Get",
			"domain": 'http://127.0.0.1:3000/',
			input: {
				v: "'1'"
			},
			conditions: ['input.v > 0'],
			tasks: {
				"pass1Task": {
					type: 'pass',
					output: {
						'fromRest': 'output.restTask.total',
						nothing: 'output.restTask.nothing'
					}
				},
				"pass2Task": {
					type: 'pass',
					output: {
						'fromPass1': "output.pass1Task.fromRest"
					}
				}
			}
		}
	]
}
