/**
 * API Client Usage Examples
 * 
 * This file demonstrates how to use the API-aware client functions
 * in React components with proper error handling and state management.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { castVote, getPollResults, setAuthToken, isAuthenticated } from '@/lib/api-client';

// Example 1: Voting Component
export function VotingComponent({ pollId }: { pollId: string }) {
  const [poll, setPoll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load poll results on component mount
  useEffect(() => {
    loadPollResults();
  }, [pollId]);

  const loadPollResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getPollResults(pollId);
      
      if (result.success && result.data) {
        setPoll(result.data.poll);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to load poll results');
      console.error('Error loading poll:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = async (optionId: string) => {
    if (!isAuthenticated()) {
      setError('Please log in to vote');
      return;
    }

    try {
      setVoting(true);
      setError(null);
      setSuccess(null);
      
      const result = await castVote(pollId, optionId);
      
      if (result.success && result.data) {
        setSuccess('Vote submitted successfully!');
        // Update poll with new results
        setPoll(prev => ({
          ...prev,
          options: result.data!.poll.results.map(option => ({
            ...option,
            percentage: Math.round((option.votes / result.data!.poll.results.reduce((sum, opt) => sum + opt.votes, 0)) * 100)
          }))
        }));
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to submit vote');
      console.error('Error voting:', err);
    } finally {
      setVoting(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading poll...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <p className="text-red-800">Error: {error}</p>
        <button 
          onClick={loadPollResults}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!poll) {
    return <div>Poll not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">{poll.title}</h2>
      {poll.description && (
        <p className="text-gray-600 mb-6">{poll.description}</p>
      )}
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
          <p className="text-green-800">{success}</p>
        </div>
      )}
      
      <div className="space-y-4">
        {poll.options.map((option: any) => (
          <div key={option.id} className="border rounded p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">{option.text}</span>
              <span className="text-sm text-gray-500">
                {option.votes} votes ({option.percentage}%)
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${option.percentage}%` }}
              />
            </div>
            
            <button
              onClick={() => handleVote(option.id)}
              disabled={voting}
              className="mt-2 w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {voting ? 'Voting...' : 'Vote'}
            </button>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-500">
        Total votes: {poll.total_votes}
      </div>
    </div>
  );
}

// Example 2: Poll Results Display Component
export function PollResultsComponent({ pollId }: { pollId: string }) {
  const [poll, setPoll] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadResults();
  }, [pollId]);

  const loadResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await getPollResults(pollId);
      
      if (result.success && result.data) {
        setPoll(result.data.poll);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to load poll results');
      console.error('Error loading results:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading results...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  if (!poll) {
    return <div>Poll not found</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">{poll.title}</h2>
      {poll.description && (
        <p className="text-gray-600 mb-6">{poll.description}</p>
      )}
      
      <div className="space-y-4">
        {poll.options
          .sort((a: any, b: any) => b.votes - a.votes)
          .map((option: any, index: number) => (
          <div key={option.id} className="border rounded p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">
                #{index + 1} {option.text}
              </span>
              <span className="text-sm text-gray-500">
                {option.votes} votes ({option.percentage}%)
              </span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${option.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-6 text-center text-sm text-gray-500">
        Total votes: {poll.total_votes}
      </div>
      
      <button
        onClick={loadResults}
        className="mt-4 w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
      >
        Refresh Results
      </button>
    </div>
  );
}

// Example 3: Authentication Helper Component
export function AuthHelper() {
  const [isAuth, setIsAuth] = useState(false);
  const [token, setToken] = useState('');

  useEffect(() => {
    setIsAuth(isAuthenticated());
  }, []);

  const handleLogin = () => {
    if (token.trim()) {
      setAuthToken(token.trim(), true);
      setIsAuth(true);
      setToken('');
    }
  };

  const handleLogout = () => {
    setAuthToken('', true);
    setIsAuth(false);
  };

  return (
    <div className="max-w-md mx-auto p-4 border rounded">
      <h3 className="text-lg font-semibold mb-4">Authentication</h3>
      
      {isAuth ? (
        <div>
          <p className="text-green-600 mb-2">✅ Authenticated</p>
          <button
            onClick={handleLogout}
            className="w-full px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>
      ) : (
        <div>
          <p className="text-red-600 mb-2">❌ Not authenticated</p>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Enter JWT token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="w-full px-3 py-2 border rounded"
            />
            <button
              onClick={handleLogin}
              disabled={!token.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Login
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Example 4: Complete Poll Management Component
export function PollManagementComponent() {
  const [pollId, setPollId] = useState('');
  const [view, setView] = useState<'vote' | 'results'>('vote');

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Poll Management</h1>
      
      <AuthHelper />
      
      <div className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Poll ID:
          </label>
          <input
            type="text"
            value={pollId}
            onChange={(e) => setPollId(e.target.value)}
            placeholder="Enter poll ID (UUID)"
            className="w-full px-3 py-2 border rounded"
          />
        </div>
        
        <div className="flex space-x-4">
          <button
            onClick={() => setView('vote')}
            className={`px-4 py-2 rounded ${
              view === 'vote' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Vote
          </button>
          <button
            onClick={() => setView('results')}
            className={`px-4 py-2 rounded ${
              view === 'results' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700'
            }`}
          >
            Results
          </button>
        </div>
        
        {pollId && (
          <div className="mt-6">
            {view === 'vote' ? (
              <VotingComponent pollId={pollId} />
            ) : (
              <PollResultsComponent pollId={pollId} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
