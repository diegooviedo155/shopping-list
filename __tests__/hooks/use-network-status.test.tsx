import { renderHook, act } from '@testing-library/react'
import { useNetworkStatus } from '@/hooks/use-network-status'

describe('useNetworkStatus', () => {
  const originalNavigatorOnLine = Object.getOwnPropertyDescriptor(navigator, 'onLine')

  function setNavigatorOnLine(value: boolean) {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => value,
    })
  }

  afterEach(() => {
    if (originalNavigatorOnLine) {
      Object.defineProperty(navigator, 'onLine', originalNavigatorOnLine)
    }
  })

  it('devuelve true cuando el navegador está online', () => {
    setNavigatorOnLine(true)
    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current).toBe(true)
  })

  it('devuelve false cuando el navegador está offline', () => {
    setNavigatorOnLine(false)
    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current).toBe(false)
  })

  it('actualiza a false cuando se dispara el evento offline', () => {
    setNavigatorOnLine(true)
    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current).toBe(true)

    act(() => {
      setNavigatorOnLine(false)
      window.dispatchEvent(new Event('offline'))
    })

    expect(result.current).toBe(false)
  })

  it('actualiza a true cuando se dispara el evento online', () => {
    setNavigatorOnLine(false)
    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current).toBe(false)

    act(() => {
      setNavigatorOnLine(true)
      window.dispatchEvent(new Event('online'))
    })

    expect(result.current).toBe(true)
  })

  it('limpia los event listeners al desmontar', () => {
    const addSpy = jest.spyOn(window, 'addEventListener')
    const removeSpy = jest.spyOn(window, 'removeEventListener')

    const { unmount } = renderHook(() => useNetworkStatus())

    const addedOnline = addSpy.mock.calls.filter(([event]) => event === 'online').length
    const addedOffline = addSpy.mock.calls.filter(([event]) => event === 'offline').length

    unmount()

    const removedOnline = removeSpy.mock.calls.filter(([event]) => event === 'online').length
    const removedOffline = removeSpy.mock.calls.filter(([event]) => event === 'offline').length

    expect(removedOnline).toBeGreaterThanOrEqual(addedOnline)
    expect(removedOffline).toBeGreaterThanOrEqual(addedOffline)

    addSpy.mockRestore()
    removeSpy.mockRestore()
  })
})
