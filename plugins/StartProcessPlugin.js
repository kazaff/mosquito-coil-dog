function StartProcessPlugin() {}
StartProcessPlugin.prototype.apply = function(PluginManager) {
    PluginManager.plugin(PluginManager.EVENTS.SYSTEM_BOOTSTRAP, function(Loader, Config) {

				let chalk = require('chalk');
				console.log(chalk.white.bgRed('     ___  ___   _____   _____   _____   _____ '));
				console.log(chalk.white.bgGreen('    /   |/   | /  ___| |  _  \\ /  _  \\ /  ___| '));
				console.log(chalk.white.bgYellow('   / /|   /| | | |     | | | | | | | | | |      '));
				console.log(chalk.white.bgBlue('  / / |__/ | | | |     | | | | | | | | | |  _    '));
				console.log(chalk.white.bgMagenta(' / /       | | | |___  | |_| | | |_| | | |_| |    '));
				console.log(chalk.white.bgCyan('/_/        |_| \\_____| |_____/ \\_____/ \\_____/     '));
				console.log('~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~');
				console.log(chalk.bgRed.bold('Author:') + ' ' + chalk.bgGreen.italic('kazaff(edisondik@gmail.com)'));
				console.log('=====================================');
				console.log(chalk.bgRed('Api Server:') + ' ' + chalk.underline('http://' + Config.api_server.host + ':' + Config.api_server.port + '/'));
				if(Config.admin_server.ifActive){
					console.log(chalk.bgCyan('Admin Server:') + ' ' + chalk.underline('http://' + Config.admin_server.host + ':' + Config.admin_server.port + '/'));
					console.log(chalk.bgCyan('account:') + ' ' +  Config.admin_server.user);
					console.log(chalk.bgCyan('password:') + ' ' + Config.admin_server.password);
				}

    });
}

module.exports = new StartProcessPlugin();
