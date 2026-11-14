/** The platform's shortcut modifier as shown in hints: ⌘ on Apple devices, "Ctrl " elsewhere. */
export const MOD_KEY = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl '
