import { http, HttpResponse } from 'msw'

// Mock data
const mockUser = {
  id: 'test-user-id',
  email: process.env.E2E_USERNAME!,
  name: 'Test User',
  created_at: '2024-01-01T00:00:00Z'
}

const mockSets = [
  {
    id: 'set-1',
    name: 'Test Set 1',
    description: 'Test description',
    user_id: 'test-user-id',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'set-2',
    name: 'Test Set 2',
    description: 'Another test description',
    user_id: 'test-user-id',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'set-3',
    name: 'Empty Set',
    description: 'Set with no cards',
    user_id: 'test-user-id',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const mockCards = [
  {
    id: 'card-1',
    front: 'Test front',
    back: 'Test back',
    set_id: 'set-1',
    user_id: 'test-user-id',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 'card-2',
    front: 'Test front 2',
    back: 'Test back 2',
    set_id: 'set-2',
    user_id: 'test-user-id',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z'
  }
]

const mockGeneration = {
  id: 'gen-1',
  status: 'completed',
  cards: mockCards,
  created_at: '2024-01-01T00:00:00Z'
}

// API handlers
export const handlers = [
  // Auth endpoints
  http.get('/api/auth/user', () => {
    return HttpResponse.json(mockUser)
  }),

  http.post('/api/auth/signin', () => {
    return HttpResponse.json({ user: mockUser, session: { access_token: 'mock-token' } })
  }),

  http.post('/api/auth/signout', () => {
    return HttpResponse.json({ message: 'Signed out successfully' })
  }),

  // Sets endpoints
  http.get('/api/sets', () => {
    return HttpResponse.json(mockSets)
  }),

  http.get('/api/sets/:id', ({ params }) => {
    const setId = params.id as string
    const set = mockSets.find(s => s.id === setId)
    
    if (!set) {
      return HttpResponse.json({ error: 'Set not found' }, { status: 404 })
    }
    
    return HttpResponse.json(set)
  }),

  http.post('/api/sets', async ({ request }) => {
    const body = await request.json() as { name: string; description?: string }
    const newSet = {
      id: `set-${Date.now()}`,
      name: body.name,
      description: body.description || '',
      user_id: 'test-user-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    return HttpResponse.json(newSet, { status: 201 })
  }),

  http.put('/api/sets/:id', async ({ params, request }) => {
    const setId = params.id as string
    const body = await request.json() as { name?: string; description?: string }
    
    const set = mockSets.find(s => s.id === setId)
    if (!set) {
      return HttpResponse.json({ error: 'Set not found' }, { status: 404 })
    }
    
    const updatedSet = {
      ...set,
      ...body,
      updated_at: new Date().toISOString()
    }
    
    return HttpResponse.json(updatedSet)
  }),

  http.delete('/api/sets/:id', ({ params }) => {
    const setId = params.id as string
    const set = mockSets.find(s => s.id === setId)
    
    if (!set) {
      return HttpResponse.json({ error: 'Set not found' }, { status: 404 })
    }
    
    return HttpResponse.json({ message: 'Set deleted successfully' })
  }),

  // Cards endpoints
  http.get('/api/sets/:setId/cards', ({ params }) => {
    const setId = params.setId as string
    const cards = mockCards.filter(c => c.set_id === setId)
    
    return HttpResponse.json(cards)
  }),

  http.post('/api/sets/:setId/cards', async ({ params, request }) => {
    const setId = params.setId as string
    const body = await request.json() as { front: string; back: string }
    
    const newCard = {
      id: `card-${Date.now()}`,
      front: body.front,
      back: body.back,
      set_id: setId,
      user_id: 'test-user-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    
    return HttpResponse.json(newCard, { status: 201 })
  }),

  // Generation endpoints
  http.post('/api/generate', async ({ request }) => {
    const body = await request.json() as { text: string; language?: string }
    
    // Simulate generation process
    const generation = {
      id: `gen-${Date.now()}`,
      status: 'processing' as const,
      created_at: new Date().toISOString()
    }
    
    return HttpResponse.json(generation, { status: 202 })
  }),

  http.get('/api/generate/:id', ({ params }) => {
    const genId = params.id as string
    
    return HttpResponse.json(mockGeneration)
  }),

  // Error handlers for testing error scenarios
  http.get('/api/error', () => {
    return HttpResponse.json({ error: 'Internal server error' }, { status: 500 })
  }),

  http.get('/api/not-found', () => {
    return HttpResponse.json({ error: 'Not found' }, { status: 404 })
  })
]
