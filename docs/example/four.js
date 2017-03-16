{
	"name": 'four',
	version: 1,
	priority: 1,
	type: "rest",
	method: 'get',
	"tasks": {
		"restTask": {
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
				total: 'output.restTask.total',
				list: '$.output.restTask.users[?(@.id!=3)]'
			},
			tasks: [
				{
					name: 'funcTask',
					type: 'function',
					"defination": function(input, output, done){
						output.data = [];
						for(var i=0,max=input.list.length;i<max;i++){
							if(input.list[i].id === 1){
								output.data.push(input.list[i]);
							}
						};
						done();
					},
					input: {
						list: 'output.restTask.list'
					},
					output: {
						total: 'output.restTask.total',
						list: 'output.funcTask.data'
					}
				}
			]
		}
	}
}
