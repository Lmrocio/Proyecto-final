import { useCallback, useMemo, useState } from 'react'
import { ArrowLeft, ClipboardCheck, Send, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import EmptyState from '../components/EmptyState'
import Modal from '../components/Modal'
import { useConfig } from '../context/configContext'
import { submitLevelTest } from '../services/levelTestService'

const DEFAULT_TOPIC =
  'Some people believe online learning should replace traditional classrooms. Discuss both views and give your opinion.'

const SCORE_LABELS = {
  task_achievement: 'Task Achievement',
  coherence_cohesion: 'Coherence & Cohesion',
  lexical_resource: 'Lexical Resource',
  grammatical_accuracy: 'Grammatical Range & Accuracy',
}

const MIN_WORDS = 150
const SHORT_COMPOSITION_ERROR = 'Escribe al menos 150 palabras para una evaluación precisa'

const countWords = (text) => {
  const matches = text.trim().match(/[\p{L}\p{N}']+/gu)

  return matches?.length ?? 0
}

const getErrorMessage = (error) => {
  const responseMessage = error?.response?.data?.message

  if (responseMessage) {
    return responseMessage
  }

  return 'No se pudo completar la evaluación. Inténtalo de nuevo en unos minutos.'
}

const LevelTest = () => {
  const { config } = useConfig()
  const [composition, setComposition] = useState('')
  const [status, setStatus] = useState('idle')
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)

  const topic = useMemo(() => config?.branding?.level_test_topic?.trim() || DEFAULT_TOPIC, [config])

  const wordCount = useMemo(() => countWords(composition), [composition])

  const canSubmit = useMemo(() => composition.trim() !== '' && status !== 'loading', [composition, status])

  const runEvaluation = useCallback(async () => {
    const cleanTopic = topic.trim()
    const cleanComposition = composition.trim()

    setIsConfirmOpen(false)

    if (!cleanTopic || !cleanComposition) {
      setStatus('error')
      setError('Escribe tu redacción antes de enviarla.')
      return
    }

    if (countWords(cleanComposition) < MIN_WORDS) {
      setStatus('error')
      setError(SHORT_COMPOSITION_ERROR)
      return
    }

    setStatus('loading')
    setError(null)

    try {
      const evaluation = await submitLevelTest({
        topic: cleanTopic,
        composition: cleanComposition,
      })

      setResult(evaluation)
      setStatus('ready')
    } catch (requestError) {
      setError(getErrorMessage(requestError))
      setStatus('error')
    }
  }, [topic, composition])

  const requestConfirmation = useCallback(
    (event) => {
      event?.preventDefault?.()

      if (status === 'loading') {
        return
      }

      if (!composition.trim()) {
        setStatus('error')
        setError('Escribe tu redacción antes de enviarla.')
        return
      }

      if (wordCount < MIN_WORDS) {
        setStatus('error')
        setError(SHORT_COMPOSITION_ERROR)
        return
      }

      setError(null)
      setIsConfirmOpen(true)
    },
    [composition, status, wordCount],
  )

  const handleCompositionChange = useCallback((event) => {
    setComposition(event.target.value)
  }, [])

  return (
    <main className="level-test">
      <header className="level-test__hero">
        <Link className="level-test__back-link" to="/">
          <ArrowLeft size={18} aria-hidden="true" />
          <span>OpenClassy</span>
        </Link>
        <p className="level-test__eyebrow">Prueba de nivel MCER</p>
        <h1 className="level-test__title">Evalúa tu writing con criterios Cambridge e IELTS</h1>
        <p className="level-test__intro">
          Escribe una redacción en inglés sobre el tema propuesto y recibe una valoración estructurada en español.
        </p>
      </header>

      <section className="level-test__workspace" aria-labelledby="level-test-form-title">
        <form className="level-test__form-panel" onSubmit={requestConfirmation}>
          <div className="level-test__form-heading">
            <Sparkles size={22} aria-hidden="true" />
            <div>
              <h2 id="level-test-form-title" className="level-test__section-title">
                Redacción
              </h2>
              <p className="level-test__section-copy">Feedback en español y puntuación de cero a diez por criterio.</p>
            </div>
          </div>

          <p className="level-test__topic-copy">
            <span className="level-test__label">Tema:</span> {topic}
          </p>

          <label className="level-test__field" htmlFor="level-test-composition">
            <span className="level-test__label">Tu composición en inglés</span>
            <textarea
              id="level-test-composition"
              className="level-test__composition"
              rows="13"
              value={composition}
              onChange={handleCompositionChange}
              placeholder="Write your composition here..."
              maxLength="12000"
              required
            />
          </label>

          <div className="level-test__form-footer">
            <p className="level-test__word-count" aria-live="polite">
              {wordCount} palabras · mínimo {MIN_WORDS}
            </p>
            <button className="level-test__submit" type="submit" disabled={!canSubmit}>
              <Send size={18} aria-hidden="true" />
              <span>{status === 'loading' ? 'Evaluando...' : 'Enviar redacción'}</span>
            </button>
          </div>
        </form>

        <aside className="level-test__result-panel" aria-live="polite">
          {status === 'loading' ? <LevelTestSkeleton /> : null}

          {status === 'idle' ? (
            <EmptyState
              title="Resultado pendiente"
              text="La evaluación aparecerá aquí con nivel MCER, puntuación por criterio y recomendaciones de mejora."
            />
          ) : null}

          {status === 'error' ? (
            <EmptyState
              title="No se pudo evaluar"
              text={error}
              actionLabel="Reintentar"
              onAction={requestConfirmation}
              tone="error"
            />
          ) : null}

          {status === 'ready' && result ? <LevelTestResult result={result} /> : null}
        </aside>
      </section>

      <Modal isOpen={isConfirmOpen} onClose={() => setIsConfirmOpen(false)} title="Confirmar envío">
        <div className="level-test__confirm">
          <p className="level-test__confirm-copy">
            Vas a enviar tu redacción para corregirla con el tema actual del sitio.
          </p>
          <p className="level-test__confirm-topic">
            <span className="level-test__label">Tema:</span> {topic}
          </p>
          <p className="level-test__confirm-meta">Palabras detectadas: {wordCount}</p>
          <div className="level-test__confirm-actions">
            <button className="level-test__secondary" type="button" onClick={() => setIsConfirmOpen(false)}>
              Seguir revisando
            </button>
            <button className="level-test__submit" type="button" onClick={runEvaluation}>
              <Send size={18} aria-hidden="true" />
              <span>Confirmar y enviar</span>
            </button>
          </div>
        </div>
      </Modal>
    </main>
  )
}

const LevelTestSkeleton = () => (
  <div className="level-test__skeleton skeleton" role="status" aria-label="Evaluando redacción">
    <div className="skeleton__line skeleton__line--short" />
    <div className="skeleton__line" />
    <div className="skeleton__line" />
    <div className="level-test__skeleton-grid">
      <div className="skeleton__line" />
      <div className="skeleton__line" />
      <div className="skeleton__line" />
      <div className="skeleton__line" />
    </div>
  </div>
)

const LevelTestResult = ({ result }) => (
  <article className="level-test__result">
    <div className="level-test__result-header">
      <div>
        <p className="level-test__result-label">Nivel estimado</p>
        <h2 className="level-test__level">{result.cefr_level}</h2>
      </div>
      <div className="level-test__total" aria-label={`Puntuación total ${result.total_score} de 40`}>
        <span>{result.total_score}</span>
        <small>/40</small>
      </div>
    </div>

    <div className="level-test__scores" role="list" aria-label="Puntuación por criterio">
      {Object.entries(SCORE_LABELS).map(([key, label]) => (
        <div key={key} className="level-test__score" role="listitem">
          <span className="level-test__score-label">{label}</span>
          <strong className="level-test__score-value">{result.scores?.[key] ?? 0}/10</strong>
        </div>
      ))}
    </div>

    <section className="level-test__feedback-section" aria-labelledby="level-test-strengths">
      <h3 id="level-test-strengths" className="level-test__feedback-title">
        Fortalezas
      </h3>
      <ul className="level-test__list">
        {result.strengths?.map((strength) => (
          <li key={strength} className="level-test__list-item">
            <ClipboardCheck size={17} aria-hidden="true" />
            <span>{strength}</span>
          </li>
        ))}
      </ul>
    </section>

    <section className="level-test__feedback-section" aria-labelledby="level-test-improvements">
      <h3 id="level-test-improvements" className="level-test__feedback-title">
        Mejoras prioritarias
      </h3>
      <div className="level-test__improvements">
        {result.improvements?.map((item) => (
          <article key={`${item.issue}-${item.suggestion}`} className="level-test__improvement">
            <h4 className="level-test__improvement-title">{item.issue}</h4>
            <p className="level-test__improvement-copy">{item.suggestion}</p>
          </article>
        ))}
      </div>
    </section>

    <section className="level-test__advice" aria-labelledby="level-test-advice">
      <h3 id="level-test-advice" className="level-test__feedback-title">
        Consejo para el siguiente nivel
      </h3>
      <p>{result.next_level_advice}</p>
    </section>
  </article>
)

export default LevelTest
