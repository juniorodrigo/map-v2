type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
	[key: string]: unknown;
}

class Logger {
	private isDevelopment: boolean;

	constructor() {
		this.isDevelopment = this.getIsDevelopment();
	}

	private getIsDevelopment(): boolean {
		try {
			const { env } = require('@/config/env');
			return env.nodeEnv === 'development';
		} catch {
			return process.env.NODE_ENV === 'development';
		}
	}

	private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
		const timestamp = new Date().toISOString();
		const contextStr = context ? `\n${JSON.stringify(context, null, 2)}` : '';
		return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
	}

	debug(message: string, context?: LogContext): void {
		if (this.isDevelopment) {
		}
	}

	info(message: string, context?: LogContext): void {}

	warn(message: string, context?: LogContext): void {}

	error(message: string, error?: Error | unknown, context?: LogContext): void {
		const errorContext =
			error instanceof Error ? { ...context, error: error.message, stack: error.stack } : { ...context, error };
	}
}

export const logger = new Logger();
