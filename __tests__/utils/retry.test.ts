import { withServerRetry } from '@/lib/utils/retry'

jest.useFakeTimers()

afterEach(() => {
  jest.clearAllTimers()
  jest.clearAllMocks()
})

describe('withServerRetry', () => {
  it('retorna el resultado directamente cuando la función tiene éxito', async () => {
    const fn = jest.fn().mockResolvedValue('ok')
    const result = await withServerRetry(fn)
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('reintenta una vez después de 800ms ante un error 500', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('HTTP 500: Internal Server Error'))
      .mockResolvedValueOnce('retried ok')

    const promise = withServerRetry(fn)
    await jest.runAllTimersAsync()
    const result = await promise

    expect(result).toBe('retried ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('reintenta ante errores 502, 503 y 504', async () => {
    for (const code of [502, 503, 504]) {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error(`HTTP ${code}: Bad Gateway`))
        .mockResolvedValueOnce('ok')

      const promise = withServerRetry(fn)
      await jest.runAllTimersAsync()
      const result = await promise

      expect(result).toBe('ok')
      expect(fn).toHaveBeenCalledTimes(2)
      fn.mockClear()
    }
  })

  it('NO reintenta errores 4xx', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('HTTP 403: Forbidden'))
    await expect(withServerRetry(fn)).rejects.toThrow('403')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('NO reintenta errores de red (ya los maneja la cola offline)', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Failed to fetch'))
    await expect(withServerRetry(fn)).rejects.toThrow('Failed to fetch')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('NO reintenta errores de timeout', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('Request timeout after 10000ms'))
    await expect(withServerRetry(fn)).rejects.toThrow('timeout')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('propaga el error del reintento si también falla', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('HTTP 500: Internal Server Error'))
      .mockRejectedValueOnce(new Error('HTTP 500: Still failing'))

    const promise = withServerRetry(fn)
    // Adjuntar el handler ANTES de avanzar los timers para evitar unhandled rejection
    const assertion = expect(promise).rejects.toThrow('Still failing')
    await jest.runAllTimersAsync()
    await assertion
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('respeta el delayMs personalizado', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('HTTP 500: Error'))
      .mockResolvedValueOnce('ok')

    const promise = withServerRetry(fn, 2000)

    // Avanzar solo 1999ms — todavía no debería haber retried
    jest.advanceTimersByTime(1999)
    expect(fn).toHaveBeenCalledTimes(1)

    // Avanzar el resto
    await jest.runAllTimersAsync()
    await promise
    expect(fn).toHaveBeenCalledTimes(2)
  })
})
