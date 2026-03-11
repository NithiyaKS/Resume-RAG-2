import { Response } from 'express';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const handleError = (error: any, res: Response): void => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      status: 'error',
      statusCode: error.statusCode,
      message: error.message,
    });
  } else {
    res.status(500).json({
      status: 'error',
      statusCode: 500,
      message: 'Internal server error',
      details: error.message,
    });
  }
};

export class ValidationError extends AppError {
  constructor(message: string) {
    super(400, message);
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, message);
    Object.setPrototypeOf(this, NotFoundError.prototype);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string = 'Internal server error') {
    super(500, message);
    Object.setPrototypeOf(this, InternalServerError.prototype);
  }
}
