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

describe('useDarkMode hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset localStorage mock
    localStorageMock.getItem.mockReturnValue(null)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with light mode by default', () => {
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.isDark).toBe(false)
    expect(result.current.theme).toBe('light')
  })

  it('should initialize with dark mode if stored in localStorage', () => {
    localStorageMock.getItem.mockReturnValue('dark')
    
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.isDark).toBe(true)
    expect(result.current.theme).toBe('dark')
  })

  it('should toggle between light and dark mode', () => {
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.isDark).toBe(false)
    
    act(() => {
      result.current.toggle()
    })
    
    expect(result.current.isDark).toBe(true)
    expect(result.current.theme).toBe('dark')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
    
    act(() => {
      result.current.toggle()
    })
    
    expect(result.current.isDark).toBe(false)
    expect(result.current.theme).toBe('light')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light')
  })

  it('should set specific theme', () => {
    const { result } = renderHook(() => useDarkMode())
    
    act(() => {
      result.current.setTheme('dark')
    })
    
    expect(result.current.isDark).toBe(true)
    expect(result.current.theme).toBe('dark')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'dark')
    
    act(() => {
      result.current.setTheme('light')
    })
    
    expect(result.current.isDark).toBe(false)
    expect(result.current.theme).toBe('light')
    expect(localStorageMock.setItem).toHaveBeenCalledWith('theme', 'light')
  })

  it('should handle system preference', () => {
    // Mock matchMedia
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn()
      }))
    })
    
    localStorageMock.getItem.mockReturnValue('system')
    
    const { result } = renderHook(() => useDarkMode())
    
    expect(result.current.theme).toBe('system')
  })
})
