import { renderHook, act } from '@testing-library/react'
import { usePullToRefresh } from '@/hooks/use-pull-to-refresh'

function makeTouchEvent(clientY: number): React.TouchEvent {
  return {
    touches: [{ clientY } as Touch],
    currentTarget: {} as EventTarget,
    preventDefault: jest.fn(),
  } as unknown as React.TouchEvent
}

describe('usePullToRefresh', () => {
  it('estado inicial es inactivo', () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => usePullToRefresh({ onRefresh }))

    expect(result.current.isPulling).toBe(false)
    expect(result.current.pullDistance).toBe(0)
    expect(result.current.isRefreshing).toBe(false)
  })

  it('al arrastrar hacia abajo se actualiza pullDistance', () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => usePullToRefresh({ onRefresh, threshold: 80 }))

    act(() => result.current.wrapperProps.onTouchStart(makeTouchEvent(100)))
    act(() => result.current.wrapperProps.onTouchMove(makeTouchEvent(200)))

    expect(result.current.isPulling).toBe(true)
    expect(result.current.pullDistance).toBeGreaterThan(0)
  })

  it('arrastrar hacia arriba no activa pulling', () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => usePullToRefresh({ onRefresh }))

    act(() => result.current.wrapperProps.onTouchStart(makeTouchEvent(200)))
    act(() => result.current.wrapperProps.onTouchMove(makeTouchEvent(100))) // hacia arriba

    expect(result.current.isPulling).toBe(false)
    expect(result.current.pullDistance).toBe(0)
  })

  it('soltar con distancia suficiente llama a onRefresh', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => usePullToRefresh({ onRefresh, threshold: 80 }))

    act(() => result.current.wrapperProps.onTouchStart(makeTouchEvent(0)))
    // Arrastrar 200px (50% de 80px threshold * 2 > threshold*0.5 = 40px visual > 36px)
    act(() => result.current.wrapperProps.onTouchMove(makeTouchEvent(200)))

    await act(async () => {
      result.current.wrapperProps.onTouchEnd()
    })

    expect(onRefresh).toHaveBeenCalledTimes(1)
  })

  it('soltar con distancia insuficiente NO llama a onRefresh', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => usePullToRefresh({ onRefresh, threshold: 80 }))

    act(() => result.current.wrapperProps.onTouchStart(makeTouchEvent(0)))
    act(() => result.current.wrapperProps.onTouchMove(makeTouchEvent(10))) // muy poco

    await act(async () => {
      result.current.wrapperProps.onTouchEnd()
    })

    expect(onRefresh).not.toHaveBeenCalled()
  })

  it('pullDistance se resetea tras soltar', async () => {
    const onRefresh = jest.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => usePullToRefresh({ onRefresh, threshold: 80 }))

    act(() => result.current.wrapperProps.onTouchStart(makeTouchEvent(0)))
    act(() => result.current.wrapperProps.onTouchMove(makeTouchEvent(100)))

    await act(async () => {
      result.current.wrapperProps.onTouchEnd()
    })

    expect(result.current.pullDistance).toBe(0)
    expect(result.current.isPulling).toBe(false)
  })

  it('isRefreshing es true mientras onRefresh ejecuta', async () => {
    let resolveRefresh!: () => void
    const onRefresh = jest.fn().mockReturnValue(new Promise<void>((res) => { resolveRefresh = res }))
    const { result } = renderHook(() => usePullToRefresh({ onRefresh, threshold: 80 }))

    act(() => result.current.wrapperProps.onTouchStart(makeTouchEvent(0)))
    act(() => result.current.wrapperProps.onTouchMove(makeTouchEvent(200)))

    act(() => { result.current.wrapperProps.onTouchEnd() })

    // Esperar que empiece el refresh
    await act(async () => {})
    expect(result.current.isRefreshing).toBe(true)

    // Resolver el refresh
    await act(async () => { resolveRefresh() })
    expect(result.current.isRefreshing).toBe(false)
  })
})
