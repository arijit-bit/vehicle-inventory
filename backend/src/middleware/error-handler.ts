import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { DuplicateEmailError, InvalidCredentialsError } from '../modules/auth/auth.types.js';
import {
  CannotChangeOwnRoleError,
  CannotDeleteSelfError,
  UserNotFoundError,
} from '../modules/auth/user-management.types.js';
import { OrderAlreadyCancelledError, OrderNotFoundError } from '../modules/orders/order.types.js';
import {
  InsufficientStockError,
  InventoryBusyError,
  VehicleNotFoundError,
} from '../modules/vehicles/vehicle.types.js';

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

  if (error instanceof UserNotFoundError) {
    response.status(404).json({
      error: {
        code: 'USER_NOT_FOUND',
        message: error.message,
      },
    });
    return;
  }

  if (error instanceof CannotDeleteSelfError || error instanceof CannotChangeOwnRoleError) {
    response.status(409).json({
      error: {
        code:
          error instanceof CannotDeleteSelfError ? 'CANNOT_DELETE_SELF' : 'CANNOT_CHANGE_OWN_ROLE',
        message: error.message,
      },
    });
    return;
  }

  if (error instanceof VehicleNotFoundError) {
    response.status(404).json({
      error: {
        code: 'VEHICLE_NOT_FOUND',
        message: error.message,
      },
    });
    return;
  }

  if (error instanceof OrderNotFoundError) {
    response.status(404).json({
      error: {
        code: 'ORDER_NOT_FOUND',
        message: error.message,
      },
    });
    return;
  }

  if (error instanceof OrderAlreadyCancelledError) {
    response.status(409).json({
      error: {
        code: 'ORDER_ALREADY_CANCELLED',
        message: error.message,
      },
    });
    return;
  }

  if (error instanceof InsufficientStockError) {
    response.status(409).json({
      error: {
        code: 'INSUFFICIENT_STOCK',
        message: error.message,
      },
    });
    return;
  }

  if (error instanceof InventoryBusyError) {
    response
      .set('Retry-After', '1')
      .status(503)
      .json({
        error: {
          code: 'INVENTORY_BUSY',
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
