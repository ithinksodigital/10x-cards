import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { server } from '../../mocks/server'
import { http, HttpResponse } from 'msw'
import { setFixtures } from '../../fixtures/test-data'

// Mock API calls
const API_BASE = 'http://localhost:3000/api'

describe('Sets API Integration', () => {
  beforeEach(() => {
    // Reset handlers before each test
    server.resetHandlers()
  })

  afterEach(() => {
    // Clean up after each test
    server.resetHandlers()
  })

  describe('GET /api/sets', () => {
    it('should fetch all sets successfully', async () => {
      const response = await fetch(`${API_BASE}/sets`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(3) // Based on mock data
    })

    it('should handle server errors', async () => {
      // Override default handler for this test
      server.use(
        http.get(`${API_BASE}/sets`, () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          )
        })
      )

      const response = await fetch(`${API_BASE}/sets`)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal server error')
    })
  })

  describe('POST /api/sets', () => {
    it('should create a new set successfully', async () => {
      const newSet = {
        name: 'New Test Set',
        description: 'A new test set'
      }

      const response = await fetch(`${API_BASE}/sets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newSet)
      })

      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.name).toBe(newSet.name)
      expect(data.description).toBe(newSet.description)
      expect(data.id).toBeDefined()
    })

    it('should handle validation errors', async () => {
      const invalidSet = {
        name: '', // Empty name should fail validation
        description: 'Valid description'
      }

      // Override handler to return validation error
      server.use(
        http.post(`${API_BASE}/sets`, () => {
          return HttpResponse.json(
            { error: 'Name is required' },
            { status: 400 }
          )
        })
      )

      const response = await fetch(`${API_BASE}/sets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(invalidSet)
      })

      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Name is required')
    })
  })

  describe('PUT /api/sets/:id', () => {
    it('should update an existing set', async () => {
      const setId = 'set-1'
      const updateData = {
        name: 'Updated Set Name',
        description: 'Updated description'
      }

      const response = await fetch(`${API_BASE}/sets/${setId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.name).toBe(updateData.name)
      expect(data.description).toBe(updateData.description)
      expect(data.id).toBe(setId)
    })

    it('should handle non-existent set', async () => {
      const nonExistentId = 'non-existent-id'
      const updateData = {
        name: 'Updated Name'
      }

      const response = await fetch(`${API_BASE}/sets/${nonExistentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      })

      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Set not found')
    })
  })

  describe('DELETE /api/sets/:id', () => {
    it('should delete a set successfully', async () => {
      const setId = 'set-1'

      const response = await fetch(`${API_BASE}/sets/${setId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.message).toBe('Set deleted successfully')
    })

    it('should handle deletion of non-existent set', async () => {
      const nonExistentId = 'non-existent-id'

      const response = await fetch(`${API_BASE}/sets/${nonExistentId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Set not found')
    })
  })

  describe('GET /api/sets/:id/cards', () => {
    it('should fetch cards for a set', async () => {
      const setId = 'set-2' // Use populated set

      const response = await fetch(`${API_BASE}/sets/${setId}/cards`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data.length).toBeGreaterThan(0)
    })

    it('should return empty array for set with no cards', async () => {
      const setId = 'set-3' // Use set with no cards

      const response = await fetch(`${API_BASE}/sets/${setId}/cards`)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(Array.isArray(data)).toBe(true)
      expect(data).toHaveLength(0)
    })
  })
})
