/**
 * Enhanced API Client Tests
 * 
 * Tests for the additional utility functions in the API client
 */

import { 
  refreshPollResults,
  getPollStatistics,
  formatPollForDisplay,
  isValidPollId,
  isValidOptionId
} from '../api-client';

// Mock the main API functions
jest.mock('../api-client', () => {
  const originalModule = jest.requireActual('../api-client');
  return {
    ...originalModule,
    getPollResults: jest.fn(),
  };
});

import { getPollResults } from '../api-client';

const mockGetPollResults = getPollResults as jest.MockedFunction<typeof getPollResults>;

describe('Enhanced API Client Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('refreshPollResults', () => {
    it('should call getPollResults with the same pollId', async () => {
      const pollId = 'test-poll-id';
      const mockResult = {
        success: true,
        message: 'Success',
        data: {
          poll: {
            id: pollId,
            title: 'Test Poll',
            total_votes: 10,
            options: []
          }
        }
      };

      mockGetPollResults.mockResolvedValue(mockResult);

      const result = await refreshPollResults(pollId);

      expect(mockGetPollResults).toHaveBeenCalledWith(pollId);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getPollStatistics', () => {
    it('should return statistics for a successful poll', async () => {
      const pollId = 'test-poll-id';
      const mockPollData = {
        success: true,
        message: 'Success',
        data: {
          poll: {
            id: pollId,
            title: 'Test Poll',
            total_votes: 100,
            options: [
              { id: 'opt1', text: 'Option 1', votes: 60, order_index: 0, percentage: 60 },
              { id: 'opt2', text: 'Option 2', votes: 40, order_index: 1, percentage: 40 }
            ]
          }
        }
      };

      mockGetPollResults.mockResolvedValue(mockPollData);

      const result = await getPollStatistics(pollId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        totalVotes: 100,
        mostPopularOption: {
          id: 'opt1',
          text: 'Option 1',
          votes: 60,
          percentage: 60
        },
        participationRate: 100,
        optionsCount: 2
      });
    });

    it('should handle poll with no votes', async () => {
      const pollId = 'test-poll-id';
      const mockPollData = {
        success: true,
        message: 'Success',
        data: {
          poll: {
            id: pollId,
            title: 'Test Poll',
            total_votes: 0,
            options: []
          }
        }
      };

      mockGetPollResults.mockResolvedValue(mockPollData);

      const result = await getPollStatistics(pollId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        totalVotes: 0,
        mostPopularOption: null,
        participationRate: 0,
        optionsCount: 0
      });
    });

    it('should handle failed poll retrieval', async () => {
      const pollId = 'test-poll-id';
      const mockError = {
        success: false,
        message: 'Poll not found'
      };

      mockGetPollResults.mockResolvedValue(mockError);

      const result = await getPollStatistics(pollId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Poll not found');
    });
  });

  describe('formatPollForDisplay', () => {
    it('should format poll with winner', () => {
      const poll = {
        id: 'test-poll-id',
        title: 'Test Poll',
        total_votes: 100,
        options: [
          { id: 'opt1', text: 'Option 1', votes: 60, order_index: 0, percentage: 60 },
          { id: 'opt2', text: 'Option 2', votes: 40, order_index: 1, percentage: 40 }
        ]
      };

      const formatted = formatPollForDisplay(poll);

      expect(formatted.winner).toEqual({
        id: 'opt1',
        text: 'Option 1',
        votes: 60,
        order_index: 0,
        percentage: 60
      });
      expect(formatted.isTie).toBe(false);
      expect(formatted.optionsByPopularity).toHaveLength(2);
      expect(formatted.optionsByPopularity[0].votes).toBe(60);
      expect(formatted.hasResults).toBe(true);
    });

    it('should detect tie', () => {
      const poll = {
        id: 'test-poll-id',
        title: 'Test Poll',
        total_votes: 100,
        options: [
          { id: 'opt1', text: 'Option 1', votes: 50, order_index: 0, percentage: 50 },
          { id: 'opt2', text: 'Option 2', votes: 50, order_index: 1, percentage: 50 }
        ]
      };

      const formatted = formatPollForDisplay(poll);

      expect(formatted.isTie).toBe(true);
      expect(formatted.winner).toEqual({
        id: 'opt1',
        text: 'Option 1',
        votes: 50,
        order_index: 0,
        percentage: 50
      });
    });

    it('should handle poll with no votes', () => {
      const poll = {
        id: 'test-poll-id',
        title: 'Test Poll',
        total_votes: 0,
        options: []
      };

      const formatted = formatPollForDisplay(poll);

      expect(formatted.winner).toBeNull();
      expect(formatted.isTie).toBe(false);
      expect(formatted.optionsByPopularity).toHaveLength(0);
      expect(formatted.hasResults).toBe(false);
    });
  });

  describe('isValidPollId', () => {
    it('should validate correct UUID format', () => {
      const validIds = [
        '123e4567-e89b-12d3-a456-426614174000',
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
      ];

      validIds.forEach(id => {
        expect(isValidPollId(id)).toBe(true);
      });
    });

    it('should reject invalid UUID format', () => {
      const invalidIds = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456-42661417400', // too short
        '123e4567-e89b-12d3-a456-4266141740000', // too long
        '123e4567-e89b-12d3-a456-42661417400g', // invalid character
        '',
        '123e4567-e89b-12d3-a456', // incomplete
      ];

      invalidIds.forEach(id => {
        expect(isValidPollId(id)).toBe(false);
      });
    });
  });

  describe('isValidOptionId', () => {
    it('should validate correct UUID format', () => {
      const validIds = [
        '123e4567-e89b-12d3-a456-426614174000',
        '550e8400-e29b-41d4-a716-446655440000',
        '6ba7b810-9dad-11d1-80b4-00c04fd430c8'
      ];

      validIds.forEach(id => {
        expect(isValidOptionId(id)).toBe(true);
      });
    });

    it('should reject invalid UUID format', () => {
      const invalidIds = [
        'not-a-uuid',
        '123e4567-e89b-12d3-a456-42661417400', // too short
        '123e4567-e89b-12d3-a456-4266141740000', // too long
        '123e4567-e89b-12d3-a456-42661417400g', // invalid character
        '',
        '123e4567-e89b-12d3-a456', // incomplete
      ];

      invalidIds.forEach(id => {
        expect(isValidOptionId(id)).toBe(false);
      });
    });
  });
});
