/**
 * API-Aware Client Functions for Polly Polling App
 * 
 * This module provides client-side functions that interact with the Polly API,
 * ensuring proper authentication, error handling, and response validation.
 */

import { PollWithResults, Vote } from './types';

// API Response Types
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Array<{ field: string; message: string }>;
}

interface VoteResponse {
  vote: Vote;
  poll: {
    id: string;
    title: string;
    results: Array<{
      id: string;
      text: string;
      votes: number;
      order_index: number;
    }>;
  };
}

interface PollResultsResponse {
  poll: PollWithResults & {
    total_votes: number;
    options: Array<{
      id: string;
      text: string;
      votes: number;
      order_index: number;
      percentage: number;
    }>;
  };
}

/**
 * Get authentication token from localStorage or sessionStorage
 * In a real app, this would be handled by your auth provider
 */
function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
}

/**
 * Make authenticated API request with proper error handling
 */
async function makeApiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = getAuthToken();
  
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (token) {
    defaultHeaders.Authorization = `Bearer ${token}`;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.message || `HTTP ${response.status}: ${response.statusText}`,
        errors: data.errors,
      };
    }

    return {
      success: true,
      message: data.message || 'Request successful',
      data: data,
    };
  } catch (error) {
    console.error('API request failed:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Network error occurred',
    };
  }
}

/**
 * 🗳️ Cast a vote on an existing poll
 * 
 * @param pollId - The UUID of the poll to vote on
 * @param optionId - The UUID of the option to vote for
 * @returns Promise with vote result and updated poll data
 * 
 * @example
 * ```typescript
 * const result = await castVote('poll-123', 'option-456');
 * if (result.success) {
 *   console.log('Vote submitted:', result.data.vote);
 *   console.log('Updated results:', result.data.poll.results);
 * } else {
 *   console.error('Vote failed:', result.message);
 * }
 * ```
 */
export async function castVote(
  pollId: string,
  optionId: string
): Promise<ApiResponse<VoteResponse>> {
  // Validate inputs
  if (!pollId || !optionId) {
    return {
      success: false,
      message: 'Poll ID and Option ID are required',
    };
  }

  // Validate UUID format (basic check)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(pollId) || !uuidRegex.test(optionId)) {
    return {
      success: false,
      message: 'Invalid poll ID or option ID format',
    };
  }

  const response = await makeApiRequest<VoteResponse>(
    `/api/polls/${pollId}/vote`,
    {
      method: 'POST',
      body: JSON.stringify({ option_id: optionId }),
    }
  );

  // Handle specific error cases
  if (!response.success) {
    if (response.message.includes('already voted')) {
      return {
        ...response,
        message: 'You have already voted on this poll',
      };
    }
    if (response.message.includes('not found')) {
      return {
        ...response,
        message: 'Poll not found or no longer active',
      };
    }
    if (response.message.includes('Invalid option')) {
      return {
        ...response,
        message: 'The selected option is not valid for this poll',
      };
    }
  }

  return response;
}

/**
 * 📊 Retrieve poll results without voting
 * 
 * @param pollId - The UUID of the poll to get results for
 * @returns Promise with poll details and results including vote counts and percentages
 * 
 * @example
 * ```typescript
 * const results = await getPollResults('poll-123');
 * if (results.success) {
 *   console.log('Poll title:', results.data.poll.title);
 *   console.log('Total votes:', results.data.poll.total_votes);
 *   results.data.poll.options.forEach(option => {
 *     console.log(`${option.text}: ${option.votes} votes (${option.percentage}%)`);
 *   });
 * } else {
 *   console.error('Failed to get results:', results.message);
 * }
 * ```
 */
export async function getPollResults(
  pollId: string
): Promise<ApiResponse<PollResultsResponse>> {
  // Validate input
  if (!pollId) {
    return {
      success: false,
      message: 'Poll ID is required',
    };
  }

  // Validate UUID format (basic check)
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(pollId)) {
    return {
      success: false,
      message: 'Invalid poll ID format',
    };
  }

  const response = await makeApiRequest<PollResultsResponse>(
    `/api/polls/${pollId}/vote`,
    {
      method: 'GET',
    }
  );

  // Handle specific error cases
  if (!response.success) {
    if (response.message.includes('not found')) {
      return {
        ...response,
        message: 'Poll not found or no longer active',
      };
    }
  }

  return response;
}

/**
 * 🔐 Set authentication token for API requests
 * 
 * @param token - The JWT token for authentication
 * @param persistent - Whether to store in localStorage (true) or sessionStorage (false)
 */
export function setAuthToken(token: string, persistent: boolean = true): void {
  if (typeof window === 'undefined') return;
  
  if (persistent) {
    localStorage.setItem('auth_token', token);
  } else {
    sessionStorage.setItem('auth_token', token);
  }
}

/**
 * 🚪 Clear authentication token
 */
export function clearAuthToken(): void {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_token');
}

/**
 * 🔍 Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return getAuthToken() !== null;
}

// Export types for external use
export type { ApiResponse, VoteResponse, PollResultsResponse };

/**
 * 🔄 Refresh poll results (useful for real-time updates)
 * 
 * @param pollId - The UUID of the poll to refresh
 * @returns Promise with updated poll results
 * 
 * @example
 * ```typescript
 * const refreshedResults = await refreshPollResults('poll-123');
 * if (refreshedResults.success) {
 *   console.log('Updated results:', refreshedResults.data.poll);
 * }
 * ```
 */
export async function refreshPollResults(
  pollId: string
): Promise<ApiResponse<PollResultsResponse>> {
  return getPollResults(pollId);
}

/**
 * 📊 Get poll statistics (total votes, participation rate, etc.)
 * 
 * @param pollId - The UUID of the poll to get statistics for
 * @returns Promise with poll statistics
 * 
 * @example
 * ```typescript
 * const stats = await getPollStatistics('poll-123');
 * if (stats.success) {
 *   console.log('Total votes:', stats.data.totalVotes);
 *   console.log('Most popular option:', stats.data.mostPopularOption);
 * }
 * ```
 */
export async function getPollStatistics(
  pollId: string
): Promise<ApiResponse<{
  totalVotes: number;
  mostPopularOption: {
    id: string;
    text: string;
    votes: number;
    percentage: number;
  } | null;
  participationRate: number;
  optionsCount: number;
}>> {
  const result = await getPollResults(pollId);
  
  if (!result.success || !result.data) {
    return {
      success: false,
      message: result.message,
    };
  }

  const { poll } = result.data;
  const mostPopularOption = poll.options.length > 0 
    ? poll.options.reduce((max, option) => 
        option.votes > max.votes ? option : max
      )
    : null;

  return {
    success: true,
    message: 'Statistics retrieved successfully',
    data: {
      totalVotes: poll.total_votes,
      mostPopularOption: mostPopularOption ? {
        id: mostPopularOption.id,
        text: mostPopularOption.text,
        votes: mostPopularOption.votes,
        percentage: mostPopularOption.percentage,
      } : null,
      participationRate: poll.total_votes > 0 ? 100 : 0, // Simplified for now
      optionsCount: poll.options.length,
    },
  };
}

/**
 * 🎨 Format poll results for display
 * 
 * @param poll - The poll with results
 * @returns Formatted poll data for UI display
 * 
 * @example
 * ```typescript
 * const formatted = formatPollForDisplay(poll);
 * console.log('Winner:', formatted.winner);
 * console.log('Options by popularity:', formatted.optionsByPopularity);
 * ```
 */
export function formatPollForDisplay(poll: PollResultsResponse['poll']) {
  const optionsByPopularity = [...poll.options].sort((a, b) => b.votes - a.votes);
  const winner = optionsByPopularity[0];
  const isTie = optionsByPopularity.length > 1 && 
                optionsByPopularity[0].votes === optionsByPopularity[1].votes;
  
  return {
    ...poll,
    winner: winner || null,
    isTie,
    optionsByPopularity,
    participationRate: poll.total_votes > 0 ? 100 : 0, // Simplified
    hasResults: poll.total_votes > 0,
  };
}

/**
 * 🔍 Validate poll ID format
 * 
 * @param pollId - The poll ID to validate
 * @returns True if valid UUID format
 */
export function isValidPollId(pollId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(pollId);
}

/**
 * 🔍 Validate option ID format
 * 
 * @param optionId - The option ID to validate
 * @returns True if valid UUID format
 */
export function isValidOptionId(optionId: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(optionId);
}
