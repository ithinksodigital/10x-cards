import React, { useEffect, useState } from 'react';
import { AuthProvider } from './AuthProvider';
import { AuthGuard } from './AuthGuard';
import { useSetsApi } from '../../hooks/useSetsApi';
import type { SetDto } from '../../types';

interface DashboardWrapperProps {
  user: any;
  session: any;
}

const DashboardContent: React.FC<{ user: any }> = ({ user }) => {
  const { sets, fetchSets, isLoading, error } = useSetsApi();
  const [totalCards, setTotalCards] = useState(0);

  useEffect(() => {
    fetchSets().catch(console.error);
  }, [fetchSets]);

  useEffect(() => {
    const total = sets.reduce((sum, set) => sum + (set.cards_count || 0), 0);
    setTotalCards(total);
  }, [sets]);

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-500 mb-4">Error loading dashboard: {error}</p>
        <button 
          onClick={() => fetchSets()} 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="text-center">
        <h2 className="text-3xl font-bold text-foreground mb-2">
          Welcome, {user.user_metadata?.full_name || user.email}!
        </h2>
        <p className="text-muted-foreground">
          Manage your flashcards and sets
        </p>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card text-card-foreground rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Sets</p>
              <p className="text-2xl font-bold">{isLoading ? '...' : sets.length}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Cards</p>
              <p className="text-2xl font-bold">{isLoading ? '...' : totalCards}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-lg border p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Due for Review</p>
              <p className="text-2xl font-bold">0</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-card text-card-foreground rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <a 
              href="/generate" 
              className="block w-full p-3 text-left border border-border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="font-medium">Generate New Cards</div>
              <div className="text-sm text-muted-foreground">Create flashcards from text</div>
            </a>
            <a 
              href="/sets" 
              className="block w-full p-3 text-left border border-border rounded-lg hover:bg-accent transition-colors"
            >
              <div className="font-medium">Browse Sets</div>
              <div className="text-sm text-muted-foreground">Manage your sets</div>
            </a>
          </div>
        </div>

        <div className="bg-card text-card-foreground rounded-lg border p-6">
          <h3 className="text-lg font-semibold mb-4">Your Sets</h3>
          {isLoading ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground">Loading sets...</p>
            </div>
          ) : sets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
              </svg>
              <p>No sets yet</p>
              <p className="text-sm mt-2">Create your first set to get started!</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {sets.slice(0, 5).map((set) => (
                <div key={set.id} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{set.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {set.cards_count || 0} cards • {set.language?.toUpperCase() || 'EN'}
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(set.created_at).toLocaleDateString()}
                  </div>
                </div>
              ))}
              {sets.length > 5 && (
                <div className="text-center pt-2">
                  <a href="/sets" className="text-sm text-primary hover:underline">
                    View all {sets.length} sets →
                  </a>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const DashboardWrapper: React.FC<DashboardWrapperProps> = ({ user, session }) => {
  return (
    <AuthProvider initialUser={user} initialSession={session}>
      <AuthGuard requireAuth={true}>
        <DashboardContent user={user} />
      </AuthGuard>
    </AuthProvider>
  );
};