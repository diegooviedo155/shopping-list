/**
 * Feedback táctil (vibración) para dispositivos móviles.
 * Usa la Vibration API del navegador cuando está disponible.
 * En dispositivos sin soporte (desktop, iOS) no hace nada.
 */

const isVibrationSupported =
  typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'

export const haptics = {
  /** Vibración corta para confirmar una acción (ej: tildar item) */
  light(): void {
    if (isVibrationSupported) navigator.vibrate(30)
  },

  /** Vibración media para acciones destructivas (ej: eliminar item) */
  medium(): void {
    if (isVibrationSupported) navigator.vibrate(60)
  },

  /** Doble vibración para errores */
  error(): void {
    if (isVibrationSupported) navigator.vibrate([40, 80, 40])
  },

  /** Vibración de éxito */
  success(): void {
    if (isVibrationSupported) navigator.vibrate([20, 40, 60])
  },
}
