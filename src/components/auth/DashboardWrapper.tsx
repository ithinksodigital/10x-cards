import React from 'react';
import { AuthProvider } from './AuthProvider';
import { AuthGuard } from './AuthGuard';

interface DashboardWrapperProps {
  user: any;
  session: any;
}

export const DashboardWrapper: React.FC<DashboardWrapperProps> = ({ user, session }) => {
  return (
    <AuthProvider initialUser={user} initialSession={session}>
      <AuthGuard requireAuth={true}>
        <div className="space-y-8">
          {/* Welcome section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Witaj, {user.user_metadata?.full_name || user.email}!
            </h2>
            <p className="text-muted-foreground">
              Zarządzaj swoimi fiszkami i zestawami
            </p>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card text-card-foreground rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Zestawy</p>
                  <p className="text-2xl font-bold">0</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Fiszki</p>
                  <p className="text-2xl font-bold">0</p>
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
                  <p className="text-sm font-medium text-muted-foreground">Do powtórki</p>
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
              <h3 className="text-lg font-semibold mb-4">Szybkie akcje</h3>
              <div className="space-y-3">
                <a 
                  href="/generate" 
                  className="block w-full p-3 text-left border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="font-medium">Generuj nowe fiszki</div>
                  <div className="text-sm text-muted-foreground">Utwórz fiszki z tekstu</div>
                </a>
                <a 
                  href="/sets" 
                  className="block w-full p-3 text-left border border-border rounded-lg hover:bg-accent transition-colors"
                >
                  <div className="font-medium">Przeglądaj zestawy</div>
                  <div className="text-sm text-muted-foreground">Zarządzaj swoimi zestawami</div>
                </a>
              </div>
            </div>

            <div className="bg-card text-card-foreground rounded-lg border p-6">
              <h3 className="text-lg font-semibold mb-4">Ostatnie aktywności</h3>
              <div className="text-center py-8 text-muted-foreground">
                <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
                </svg>
                <p>Brak ostatnich aktywności</p>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    </AuthProvider>
  );
};