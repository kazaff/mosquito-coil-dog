let handler = require(__dirname + '/compiled_services/rest_get_example_0.2_0.js');

let context = {
		request: {
			query:{
				id: 1
			},
			header:{}
		},
		output: {}
	};

handler(context, ()=>{
	console.log(context.output);
});
