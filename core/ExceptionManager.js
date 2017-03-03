class Exception extends Error{}
class LoaderError extends Exception{
	constructor(message){
		super(message);
		this.message = message;
		this.name = 'LoaderError';
	}
}
class ConfigError extends Exception{
	constructor(message){
		super(message);
		this.message = message;
		this.name = 'ConfigError';
	}
}
class StorageError extends Exception{
	constructor(message){
		super(message);
		this.message = message;
		this.name = 'StorageError';
	}
}

class ExceptionFactory{
	create(name, message){
		switch (name) {
			case 'LoaderError':
				return new LoaderError(message);
			case 'ConfigError':
				return new ConfigError(message);
			case 'StorageError':
				return new StorageError(message);
			default:
				return new Error('no exception type');
		}
	}
}

module.exports = {
	factory : new ExceptionFactory(),
	Klass: Exception
};
