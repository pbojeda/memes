import { Response } from 'express';
import {
  success,
  created,
  noContent,
  paginated,
  ApiResponse,
  PaginatedResponse,
} from './responseHelpers';

describe('Response Helpers', () => {
  let mockRes: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let sendMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    sendMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock, send: sendMock });
    mockRes = {
      status: statusMock,
      json: jsonMock,
    };
  });

  describe('success', () => {
    it('should return 200 status with data', () => {
      const data = { id: 1, name: 'Test' };
      success(mockRes as Response, data);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data,
      });
    });

    it('should include message when provided', () => {
      const data = { id: 1 };
      success(mockRes as Response, data, 'Operation successful');

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data,
        message: 'Operation successful',
      });
    });

    it('should handle null data', () => {
      success(mockRes as Response, null);

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: null,
      });
    });
  });

  describe('created', () => {
    it('should return 201 status with data', () => {
      const data = { id: 1, name: 'New Item' };
      created(mockRes as Response, data);

      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data,
      });
    });

    it('should include message when provided', () => {
      const data = { id: 1 };
      created(mockRes as Response, data, 'Resource created');

      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data,
        message: 'Resource created',
      });
    });
  });

  describe('noContent', () => {
    it('should return 204 status with no body', () => {
      noContent(mockRes as Response);

      expect(statusMock).toHaveBeenCalledWith(204);
      expect(sendMock).toHaveBeenCalled();
    });
  });

  describe('paginated', () => {
    it('should return paginated response with metadata', () => {
      const data = [{ id: 1 }, { id: 2 }];
      const pagination = {
        page: 1,
        limit: 10,
        total: 25,
      };

      paginated(mockRes as Response, data, pagination);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data,
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3,
          hasNext: true,
          hasPrev: false,
        },
      });
    });

    it('should calculate totalPages correctly', () => {
      const data = [{ id: 1 }];
      const pagination = { page: 2, limit: 5, total: 12 };

      paginated(mockRes as Response, data, pagination);

      const call = jsonMock.mock.calls[0][0] as PaginatedResponse<unknown>;
      expect(call.pagination.totalPages).toBe(3);
    });

    it('should set hasNext false on last page', () => {
      const data = [{ id: 1 }];
      const pagination = { page: 3, limit: 5, total: 12 };

      paginated(mockRes as Response, data, pagination);

      const call = jsonMock.mock.calls[0][0] as PaginatedResponse<unknown>;
      expect(call.pagination.hasNext).toBe(false);
    });

    it('should set hasPrev true when not on first page', () => {
      const data = [{ id: 1 }];
      const pagination = { page: 2, limit: 5, total: 12 };

      paginated(mockRes as Response, data, pagination);

      const call = jsonMock.mock.calls[0][0] as PaginatedResponse<unknown>;
      expect(call.pagination.hasPrev).toBe(true);
    });
  });

  describe('Type exports', () => {
    it('should export ApiResponse type', () => {
      const response: ApiResponse<{ id: number }> = {
        success: true,
        data: { id: 1 },
      };
      expect(response.success).toBe(true);
    });

    it('should export PaginatedResponse type', () => {
      const response: PaginatedResponse<{ id: number }> = {
        success: true,
        data: [{ id: 1 }],
        pagination: {
          page: 1,
          limit: 10,
          total: 1,
          totalPages: 1,
          hasNext: false,
          hasPrev: false,
        },
      };
      expect(response.pagination.totalPages).toBe(1);
    });
  });
});
