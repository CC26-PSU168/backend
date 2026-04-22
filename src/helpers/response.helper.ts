import { Response } from 'express';

interface SuccessResponse {
  status: 'success';
  message: string;
  data?: unknown;
}

interface ErrorResponse {
  status: 'fail' | 'error';
  message: string;
  errors?: unknown;
}

export const sendSuccess = (res: Response, statusCode: number, message: string, data?: unknown) => {
  const response: SuccessResponse = {
    status: 'success',
    message,
    ...(data !== undefined && { data }),
  };
  return res.status(statusCode).json(response);
};

export const sendError = (res: Response, statusCode: number, message: string, errors?: unknown) => {
  const response: ErrorResponse = {
    status: statusCode >= 500 ? 'error' : 'fail',
    message,
    ...(errors !== undefined && { errors }),
  };
  return res.status(statusCode).json(response);
};
