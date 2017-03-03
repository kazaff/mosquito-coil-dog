function StartProcessPlugin() {}
StartProcessPlugin.prototype.apply = function(PluginManager) {
    PluginManager.plugin(PluginManager.EVENTS.SYSTEM_BOOTSTRAP, function(Loader) {

				let chalk = Loader.load('chalk', 'chalk');
				console.log(chalk.white.bgRed('     ___  ___   _____   _____   _____   _____ '));
				console.log(chalk.white.bgGreen('    /   |/   | /  ___| |  _  \\ /  _  \\ /  ___| '));
				console.log(chalk.white.bgYellow('   / /|   /| | | |     | | | | | | | | | |      '));
				console.log(chalk.white.bgBlue('  / / |__/ | | | |     | | | | | | | | | |  _    '));
				console.log(chalk.white.bgMagenta(' / /       | | | |___  | |_| | | |_| | | |_| |    '));
				console.log(chalk.white.bgCyan('/_/        |_| \\_____| |_____/ \\_____/ \\_____/     '));
				console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
				console.log(chalk.bgRed.bold('Author:') + ' ' + chalk.bgGreen.italic('kazaff(edisondik@gmail.com)'));
    });
}

module.exports = new StartProcessPlugin();
