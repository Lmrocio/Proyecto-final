import { useEffect, useId, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useConfig } from '../context/configContext'

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

const Modal = ({ isOpen, onClose, title, children }) => {
  const titleId = useId()
  const contentRef = useRef(null)
  const closeButtonRef = useRef(null)
  const { uiVariant } = useConfig()

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const previousFocusedElement = document.activeElement
    document.body.style.overflow = 'hidden'

    const focusInitialElement = () => {
      const focusableElements = contentRef.current?.querySelectorAll(FOCUSABLE_SELECTOR)
      const firstFocusableElement = focusableElements?.[0]

      if (firstFocusableElement instanceof HTMLElement) {
        firstFocusableElement.focus()
        return
      }

      closeButtonRef.current?.focus()
    }

    focusInitialElement()

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose?.()
        return
      }

      if (event.key !== 'Tab' || !contentRef.current) {
        return
      }

      const focusableElements = Array.from(contentRef.current.querySelectorAll(FOCUSABLE_SELECTOR))
        .filter((element) => element instanceof HTMLElement)

      if (!focusableElements.length) {
        event.preventDefault()
        closeButtonRef.current?.focus()
        return
      }

      const firstFocusableElement = focusableElements[0]
      const lastFocusableElement = focusableElements[focusableElements.length - 1]

      if (event.shiftKey && document.activeElement === firstFocusableElement) {
        event.preventDefault()
        lastFocusableElement.focus()
      }

      if (!event.shiftKey && document.activeElement === lastFocusableElement) {
        event.preventDefault()
        firstFocusableElement.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
      if (previousFocusedElement instanceof HTMLElement) {
        previousFocusedElement.focus()
      }
    }
  }, [isOpen, onClose])

  if (!isOpen || typeof document === 'undefined') {
    return null
  }

  return createPortal(
    <div className="modal" data-variant={uiVariant ?? 'v1'} role="presentation">
      <button className="modal__overlay" type="button" aria-label="Cerrar modal" onClick={onClose} />
      <section
        ref={contentRef}
        className="modal__content"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <button ref={closeButtonRef} className="modal__close" type="button" aria-label="Cerrar" onClick={onClose}>
          <X size={18} />
        </button>
        <header className="modal__header">
          <h2 id={titleId} className="modal__title">
            {title}
          </h2>
        </header>
        <div className="modal__body">{children}</div>
      </section>
    </div>,
    document.body,
  )
}

export default Modal