import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDarkMode } from '@/hooks/useDarkMode'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock matchMedia
const mockMatchMedia = vi.fn().mockImplementation(query => ({
  matches: query === '(prefers-color-scheme: dark)',
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn()
}))

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: mockMatchMedia
})

describe('useDarkMode hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null)
    // Reset matchMedia mock to return false (light mode)
    mockMatchMedia.mockImplementation(query => ({
      matches: false, // Always return false for light mode
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with light mode by default', () => {
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.isDark).toBe(false)
    expect(result.current.toggleDarkMode).toBeDefined()
  })

  it('should initialize with dark mode if stored in localStorage', () => {
    localStorageMock.getItem.mockReturnValue('dark')
    
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.isDark).toBe(true)
  })

  it('should toggle between light and dark mode', () => {
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.isDark).toBe(false)
    
    act(() => {
      result.current.toggleDarkMode()
    })
    
    expect(result.current.isDark).toBe(true)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
    
    act(() => {
      result.current.toggleDarkMode()
    })
    
    expect(result.current.isDark).toBe(false)
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light')
  })

  it('should handle system preference when no saved theme', () => {
    // Mock system preference to dark
    mockMatchMedia.mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
    
    localStorageMock.getItem.mockReturnValue(null)
    
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.isDark).toBe(true)
  })

  it('should prioritize saved theme over system preference', () => {
    // Mock system preference to dark
    mockMatchMedia.mockImplementation(query => ({
      matches: query === '(prefers-color-scheme: dark)',
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    }))
    
    // But saved theme is light
    localStorageMock.getItem.mockReturnValue('light')
    
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.isDark).toBe(false)
  })
})
