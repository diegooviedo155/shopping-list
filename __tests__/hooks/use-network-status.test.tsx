import { renderHook, act } from '@testing-library/react'
import { useNetworkStatus } from '@/hooks/use-network-status'

/**
 * useNetworkStatus tiene un debounce de 3s para declarar "offline" y evitar
 * falsos positivos en Android/PWA. Los tests usan fake timers para avanzarlos.
 */
describe('useNetworkStatus', () => {
  const originalNavigatorOnLine = Object.getOwnPropertyDescriptor(navigator, 'onLine')

  function setNavigatorOnLine(value: boolean) {
    Object.defineProperty(navigator, 'onLine', {
      configurable: true,
      get: () => value,
    })
  }

  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
    if (originalNavigatorOnLine) {
      Object.defineProperty(navigator, 'onLine', originalNavigatorOnLine)
    }
  })

  it('devuelve true cuando el navegador está online (estado inicial optimista)', () => {
    setNavigatorOnLine(true)
    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current).toBe(true)
  })

  it('devuelve false cuando el navegador está offline (tras el debounce de 3s)', async () => {
    setNavigatorOnLine(false)
    const { result } = renderHook(() => useNetworkStatus())

    // Antes del debounce: sigue siendo true (optimista)
    expect(result.current).toBe(true)

    // Avanzar 3 segundos
    await act(async () => { jest.advanceTimersByTime(3000) })

    expect(result.current).toBe(false)
  })

  it('actualiza a false tras el debounce cuando se dispara el evento offline', async () => {
    setNavigatorOnLine(true)
    const { result } = renderHook(() => useNetworkStatus())
    expect(result.current).toBe(true)

    act(() => {
      setNavigatorOnLine(false)
      window.dispatchEvent(new Event('offline'))
    })

    // Todavía true (el debounce no se completó)
    expect(result.current).toBe(true)

    await act(async () => { jest.advanceTimersByTime(3000) })

    expect(result.current).toBe(false)
  })

  it('actualiza a true inmediatamente cuando se dispara el evento online', async () => {
    setNavigatorOnLine(false)
    const { result } = renderHook(() => useNetworkStatus())

    // Avanzar debounce para llegar a offline
    await act(async () => { jest.advanceTimersByTime(3000) })
    expect(result.current).toBe(false)

    act(() => {
      setNavigatorOnLine(true)
      window.dispatchEvent(new Event('online'))
    })

    // Online se aplica inmediatamente (sin debounce)
    expect(result.current).toBe(true)
  })

  it('cancela el debounce si vuelve online antes de los 3s', async () => {
    setNavigatorOnLine(true)
    const { result } = renderHook(() => useNetworkStatus())

    act(() => {
      setNavigatorOnLine(false)
      window.dispatchEvent(new Event('offline'))
    })

    // Avanzar solo 1s (debounce no completado)
    jest.advanceTimersByTime(1000)

    act(() => {
      setNavigatorOnLine(true)
      window.dispatchEvent(new Event('online'))
    })

    // Avanzar los 2s restantes — el debounce fue cancelado, sigue online
    await act(async () => { jest.advanceTimersByTime(2000) })

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
