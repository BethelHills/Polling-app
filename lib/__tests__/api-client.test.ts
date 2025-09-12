/**
 * Test suite for API Client Functions
 * 
 * This file demonstrates usage examples and tests for the API-aware client functions.
 * Run with: npm test -- api-client.test.ts
 */

import { castVote, getPollResults, setAuthToken, clearAuthToken, isAuthenticated } from '../api-client';

// Mock fetch for testing
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock sessionStorage
const sessionStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

describe('API Client Functions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearAuthToken();
  });

  describe('castVote', () => {
    it('should successfully cast a vote with valid inputs', async () => {
      const pollId = '123e4567-e89b-12d3-a456-426614174000';
      const optionId = '123e4567-e89b-12d3-a456-426614174001';
      
      const mockResponse = {
        success: true,
        message: 'Vote submitted successfully!',
        vote: {
          id: 'vote-123',
          poll_id: pollId,
          option_id: optionId,
          user_id: 'user-789',
          created_at: '2024-01-01T00:00:00Z',
        },
        poll: {
          id: pollId,
          title: 'Test Poll',
          results: [
            { id: optionId, text: 'Option 1', votes: 5, order_index: 0 },
            { id: '123e4567-e89b-12d3-a456-426614174002', text: 'Option 2', votes: 3, order_index: 1 },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await castVote(pollId, optionId);

      expect(result.success).toBe(true);
      expect(result.data?.vote.id).toBe('vote-123');
      expect(result.data?.poll.results).toHaveLength(2);
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/polls/${pollId}/vote`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ option_id: optionId }),
        })
      );
    });

    it('should handle validation errors', async () => {
      const result = await castVote('', 'option-456');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Poll ID and Option ID are required');
    });

    it('should handle invalid UUID format', async () => {
      const result = await castVote('invalid-id', 'option-456');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Invalid poll ID or option ID format');
    });

    it('should handle already voted error', async () => {
      const pollId = '123e4567-e89b-12d3-a456-426614174000';
      const optionId = '123e4567-e89b-12d3-a456-426614174001';
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          success: false,
          message: 'You have already voted on this poll',
        }),
      } as Response);

      const result = await castVote(pollId, optionId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('You have already voted on this poll');
    });

    it('should handle poll not found error', async () => {
      const pollId = '123e4567-e89b-12d3-a456-426614174000';
      const optionId = '123e4567-e89b-12d3-a456-426614174001';
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          message: 'Poll not found',
        }),
      } as Response);

      const result = await castVote(pollId, optionId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Poll not found or no longer active');
    });
  });

  describe('getPollResults', () => {
    it('should successfully retrieve poll results', async () => {
      const pollId = '123e4567-e89b-12d3-a456-426614174000';
      
      const mockResponse = {
        success: true,
        poll: {
          id: pollId,
          title: 'Test Poll',
          description: 'A test poll',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          owner_id: 'user-123',
          total_votes: 8,
          options: [
            { id: '123e4567-e89b-12d3-a456-426614174001', text: 'Option 1', votes: 5, order_index: 0, percentage: 63 },
            { id: '123e4567-e89b-12d3-a456-426614174002', text: 'Option 2', votes: 3, order_index: 1, percentage: 37 },
          ],
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await getPollResults(pollId);

      expect(result.success).toBe(true);
      expect(result.data?.poll.title).toBe('Test Poll');
      expect(result.data?.poll.total_votes).toBe(8);
      expect(result.data?.poll.options).toHaveLength(2);
      expect(result.data?.poll.options[0].percentage).toBe(63);
      expect(mockFetch).toHaveBeenCalledWith(
        `/api/polls/${pollId}/vote`,
        expect.objectContaining({
          method: 'GET',
        })
      );
    });

    it('should handle validation errors', async () => {
      const result = await getPollResults('');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Poll ID is required');
    });

    it('should handle poll not found error', async () => {
      const pollId = '123e4567-e89b-12d3-a456-426614174000';
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          success: false,
          message: 'Poll not found',
        }),
      } as Response);

      const result = await getPollResults(pollId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Poll not found or no longer active');
    });
  });

  describe('Authentication Functions', () => {
    it('should set and get auth token from localStorage', () => {
      setAuthToken('test-token-123', true);
      expect(localStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'test-token-123');
    });

    it('should set and get auth token from sessionStorage', () => {
      setAuthToken('test-token-456', false);
      expect(sessionStorageMock.setItem).toHaveBeenCalledWith('auth_token', 'test-token-456');
    });

    it('should clear auth token', () => {
      clearAuthToken();
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
      expect(sessionStorageMock.removeItem).toHaveBeenCalledWith('auth_token');
    });

    it('should check authentication status', () => {
      localStorageMock.getItem.mockReturnValue('test-token');
      expect(isAuthenticated()).toBe(true);
      
      localStorageMock.getItem.mockReturnValue(null);
      sessionStorageMock.getItem.mockReturnValue(null);
      expect(isAuthenticated()).toBe(false);
    });
  });
});

// Usage Examples (commented out to avoid execution during tests)
/*
// Example 1: Cast a vote
async function exampleCastVote() {
  try {
    const result = await castVote('poll-123', 'option-456');
    
    if (result.success) {
      console.log('✅ Vote submitted successfully!');
      console.log('Vote ID:', result.data?.vote.id);
      console.log('Updated results:', result.data?.poll.results);
    } else {
      console.error('❌ Vote failed:', result.message);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Example 2: Get poll results
async function exampleGetPollResults() {
  try {
    const result = await getPollResults('poll-123');
    
    if (result.success) {
      console.log('✅ Poll results retrieved!');
      console.log('Poll title:', result.data?.poll.title);
      console.log('Total votes:', result.data?.poll.total_votes);
      
      result.data?.poll.options.forEach(option => {
        console.log(`${option.text}: ${option.votes} votes (${option.percentage}%)`);
      });
    } else {
      console.error('❌ Failed to get results:', result.message);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Example 3: Authentication flow
function exampleAuthentication() {
  // Set auth token after user login
  setAuthToken('jwt-token-here', true);
  
  // Check if user is authenticated
  if (isAuthenticated()) {
    console.log('✅ User is authenticated');
  } else {
    console.log('❌ User is not authenticated');
  }
  
  // Clear token on logout
  clearAuthToken();
}

// Example 4: Complete voting flow
async function exampleCompleteVotingFlow() {
  // 1. Get poll results first
  const results = await getPollResults('poll-123');
  if (!results.success) {
    console.error('Failed to load poll:', results.message);
    return;
  }
  
  console.log('Poll loaded:', results.data?.poll.title);
  
  // 2. Cast a vote
  const voteResult = await castVote('poll-123', 'option-456');
  if (voteResult.success) {
    console.log('Vote cast successfully!');
    
    // 3. Get updated results
    const updatedResults = await getPollResults('poll-123');
    if (updatedResults.success) {
      console.log('Updated results:', updatedResults.data?.poll.options);
    }
  } else {
    console.error('Vote failed:', voteResult.message);
  }
}
*/
