import { useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_THRESHOLD = [0.2, 0.35, 0.5, 0.7]
const DEFAULT_ROOT_MARGIN = '-20% 0px -45% 0px'

const useScrollSpy = (ids = [], options = {}) => {
  const [activeId, setActiveId] = useState(() => ids[0] ?? null)
  const sectionMapRef = useRef(new Map())

  const threshold = options.threshold ?? DEFAULT_THRESHOLD
  const rootMargin = options.rootMargin ?? DEFAULT_ROOT_MARGIN

  const registerSection = useCallback(
    (id) => (element) => {
      if (element) {
        element.dataset.spyId = id
        sectionMapRef.current.set(id, element)
        return
      }

      sectionMapRef.current.delete(id)
    },
    [],
  )

  useEffect(() => {
    if (!ids.length) {
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((entryA, entryB) => {
            if (entryB.intersectionRatio !== entryA.intersectionRatio) {
              return entryB.intersectionRatio - entryA.intersectionRatio
            }

            return entryA.boundingClientRect.top - entryB.boundingClientRect.top
          })

        if (!visibleEntries.length) {
          return
        }

        const nextId = visibleEntries[0].target.dataset.spyId

        if (!nextId) {
          return
        }

        setActiveId((currentId) => (currentId === nextId ? currentId : nextId))
      },
      {
        threshold,
        rootMargin,
      },
    )

    ids.forEach((id) => {
      const section = sectionMapRef.current.get(id)

      if (section) {
        observer.observe(section)
      }
    })

    return () => {
      observer.disconnect()
    }
  }, [ids, rootMargin, threshold])

  const resolvedActiveId = ids.includes(activeId) ? activeId : (ids[0] ?? null)

  return {
    activeId: resolvedActiveId,
    registerSection,
  }
}

export default useScrollSpy
