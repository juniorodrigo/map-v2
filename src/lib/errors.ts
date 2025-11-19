export class AppError extends Error {
	constructor(
		message: string,
		public readonly statusCode: number = 500,
		public readonly context?: Record<string, unknown>
	) {
		super(message);
		this.name = 'AppError';
	}
}

export class DatabaseError extends AppError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, 500, context);
		this.name = 'DatabaseError';
	}
}

export class ValidationError extends AppError {
	constructor(message: string, context?: Record<string, unknown>) {
		super(message, 400, context);
		this.name = 'ValidationError';
	}
}

export class NotFoundError extends AppError {
	constructor(message: string = 'Recurso no encontrado', context?: Record<string, unknown>) {
		super(message, 404, context);
		this.name = 'NotFoundError';
	}
}
