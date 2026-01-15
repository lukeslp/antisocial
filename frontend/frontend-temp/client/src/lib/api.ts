// API client for Account Discovery Tool backend
const API_BASE = import.meta.env.VITE_API_URL || '/social-scout';

export interface Platform {
  id: string;
  name: string;
  tier: number;
  category: string;
  enabled: boolean;
  url_template: string;
  verification_method: string;
}

export interface Search {
  id: number;
  username: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  platforms_checked: number;
  platforms_total: number;
  accounts_found: number;
  created_at: string;
  completed_at?: string;
}

export interface Account {
  id: number;
  search_id: number;
  platform_id: string;
  platform_name: string;
  username: string;
  profile_url: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  verification_method: string;
  confidence_score: number;
  status: 'pending' | 'confirmed' | 'false_positive' | 'deleted';
  discovered_at: string;
  verified_at?: string;
}

export interface Stats {
  total_searches: number;
  completed_searches: number;
  total_accounts: number;
  confirmed_accounts: number;
  deleted_accounts: number;
  pending_accounts: number;
}

async function fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  
  return response.json();
}

export const api = {
  // Health check
  health: async (): Promise<{ status: string; app: string }> => {
    return fetchApi('/api/health');
  },

  // Platforms
  getPlatforms: async (): Promise<{ platforms: Platform[] }> => {
    return fetchApi('/api/platforms');
  },

  // Searches
  createSearch: async (data: {
    username: string;
    tiers?: number[];
    min_confidence?: number;
    deep_search?: boolean;  // Enable WhatsMyName (765+ platforms)
  }): Promise<Search> => {
    return fetchApi('/api/searches', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getSearches: async (): Promise<{ searches: Search[] }> => {
    return fetchApi('/api/searches');
  },

  getSearch: async (id: number): Promise<Search> => {
    return fetchApi(`/api/searches/${id}`);
  },

  getSearchResults: async (id: number): Promise<{ accounts: Account[] }> => {
    return fetchApi(`/api/searches/${id}/results`);
  },

  // Accounts
  getAccounts: async (status?: string): Promise<{ accounts: Account[] }> => {
    const query = status && status !== 'all' ? `?status=${status}` : '';
    return fetchApi(`/api/accounts${query}`);
  },

  updateAccount: async (id: number, data: { status: string }): Promise<Account> => {
    return fetchApi(`/api/accounts/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  bulkUpdateAccounts: async (data: {
    account_ids: number[];
    status: string;
  }): Promise<{ updated: number }> => {
    return fetchApi('/api/accounts/bulk-update', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Stats
  getStats: async (): Promise<Stats> => {
    return fetchApi('/api/stats');
  },
};
