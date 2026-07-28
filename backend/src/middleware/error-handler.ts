import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { DuplicateEmailError, InvalidCredentialsError } from '../modules/auth/auth.types.js';

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  void _next;

  if (error instanceof ZodError) {
    response.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'The request contains invalid data',
        details: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      },
    });
    return;
  }

  if (error instanceof DuplicateEmailError) {
    response.status(409).json({
      error: {
        code: 'EMAIL_ALREADY_EXISTS',
        message: error.message,
      },
    });
    return;
  }

  if (error instanceof InvalidCredentialsError) {
    response.status(401).json({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: error.message,
      },
    });
    return;
  }

  response.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An unexpected error occurred',
    },
  });
};
