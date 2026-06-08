import { useEffect } from 'react'

export const useOnClickOutside = (ref, onOutsideClick, isEnabled = true) => {
  useEffect(() => {
    if (!isEnabled || !ref?.current) {
      return undefined
    }

    const handlePointerDown = (event) => {
      if (!ref.current?.contains(event.target)) {
        onOutsideClick?.(event)
      }
    }

    document.addEventListener('pointerdown', handlePointerDown)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isEnabled, onOutsideClick, ref])
}