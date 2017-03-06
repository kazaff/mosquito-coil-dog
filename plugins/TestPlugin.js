function TestPlugin() {}
TestPlugin.prototype.apply = function(PluginManager) {
		PluginManager.plugin(PluginManager.EVENTS.TASK_COMPLETE, function(Context, cb) {
			console.log('TASK_COMPLETE');
			cb();
    });
}

module.exports = new TestPlugin();
