import { Response } from 'express';
import { ApiResponse, PaginatedResponse } from '@pulsechat/shared';

export function sendSuccess<T>(res: Response, data: T, message?: string, statusCode: number = 200): Response {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(response);
}

export function sendPaginated<T>(
  res: Response,
  items: T[],
  nextCursor?: string | null,
  hasMore: boolean = false,
  total?: number,
  statusCode: number = 200
): Response {
  const paginated: PaginatedResponse<T> = {
    items,
    nextCursor,
    hasMore,
    total,
  };
  const response: ApiResponse<PaginatedResponse<T>> = {
    success: true,
    data: paginated,
  };
  return res.status(statusCode).json(response);
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = 500,
  errors?: Record<string, string[]>
): Response {
  const response: ApiResponse = {
    success: false,
    error: message,
    errors,
  };
  return res.status(statusCode).json(response);
}
