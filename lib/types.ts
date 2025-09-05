export interface Poll {
  id: string;
  title: string;
  description?: string;
  options: PollOption[];
  created_at: string;
  updated_at: string;
  total_votes: number;
  is_active: boolean;
}

export interface PollOption {
  id: string;
  poll_id: string;
  text: string;
  votes: number;
  order: number;
}

export interface Vote {
  id: string;
  poll_id: string;
  option_id: string;
  voter_ip?: string;
  created_at: string;
}

export interface PollWithResults extends Poll {
  options: (PollOption & { percentage: number })[];
  user_has_voted: boolean;
  user_vote_option_id?: string;
}
