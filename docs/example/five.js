{
	"name": 'five',
	version: 1,
	priority: 1,
	type: "rest",
	method: 'get',
	"tasks": [
		{
			name: 'productsTask',
			type: 'rest',
			method: 'get',
			domain: 'http://192.168.1.27/git/source/index.php?route=api/mobile/product/getproducts',
			tasks: {
				filterTask: {
					type: 'function',
					defination: function(input, output, done){
						output.data = _.filter(input.products, function(item){
							return _.toNumber(_.trim(item.price, '￥')) > 200;
						});
						done();
					},
					input: {
						products: 'output.productsTask.data.products'
					}
				}
			}
		},
		{
			name: 'categoriesTask',
			type: 'rest',
			method: 'get',
			domain: 'http://192.168.1.27/git/source/index.php?route=api/mobile/product/getcategorys',
		}
	],
	output: {
		products: 'output.filterTask.data',
		categories: '$.output.categoriesTask.data..name'
	}
}
