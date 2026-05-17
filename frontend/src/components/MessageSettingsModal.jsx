import { useId, useState } from 'react'
import Modal from './Modal'
import { apiClient } from '../services/apiClient'

const DEFAULT_SETTINGS = {
  receiveIndividualEmail: true,
  receiveCourseEmail: true,
  readReceipts: true,
  autoSignature: false,
  signature: '',
  undoSend: false,
  undoSendDelaySeconds: '10',
}

const UNDO_SEND_OPTIONS = [
  { value: '5', label: '5 segundos' },
  { value: '10', label: '10 segundos' },
  { value: '30', label: '30 segundos' },
]

const SETTINGS_FIELDS = [
  {
    key: 'receiveIndividualEmail',
    label: 'Recibir email por mensaje individual',
    hint: 'Te avisaremos por correo cuando alguien te escriba directamente.',
  },
  {
    key: 'receiveCourseEmail',
    label: 'Recibir email por mensaje de curso',
    hint: 'Recibe avisos de comunicaciones publicadas para tus cursos.',
  },
  {
    key: 'readReceipts',
    label: 'Confirmación de lectura',
    hint: 'Permite que otros vean cuándo has leído sus mensajes.',
  },
  {
    key: 'autoSignature',
    label: 'Añadir firma automática',
    hint: 'Incluye una firma personalizada al final de tus respuestas.',
  },
  {
    key: 'undoSend',
    label: 'Deshacer envío',
    hint: 'Mantén el mensaje unos segundos en espera antes de enviarlo.',
  },
]

const getErrorMessage = (requestError) => {
  const responseMessage = requestError?.response?.data?.message

  if (responseMessage) {
    return responseMessage
  }

  return 'No se pudieron guardar los ajustes. Inténtalo de nuevo en unos segundos.'
}

const toPayload = (settings) => ({
  receive_individual_email: settings.receiveIndividualEmail,
  receive_course_email: settings.receiveCourseEmail,
  read_receipts_enabled: settings.readReceipts,
  automatic_signature_enabled: settings.autoSignature,
  signature: settings.autoSignature ? settings.signature : '',
  undo_send_enabled: settings.undoSend,
  undo_send_delay_seconds: settings.undoSend ? Number(settings.undoSendDelaySeconds) : null,
})

const MessageSettingsModal = ({ isOpen, onClose, initialSettings = null, onSaved }) => {
  const baseId = useId()
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...initialSettings }))
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState(null)
  const [statusMessage, setStatusMessage] = useState('')

  const updateBooleanSetting = (settingName) => (event) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [settingName]: event.target.checked,
    }))
    setError(null)
    setStatusMessage('')
  }

  const updateTextSetting = (settingName) => (event) => {
    setSettings((currentSettings) => ({
      ...currentSettings,
      [settingName]: event.target.value,
    }))
    setError(null)
    setStatusMessage('')
  }

  const handleSave = async (event) => {
    event.preventDefault()

    if (isSaving) {
      return
    }

    setIsSaving(true)
    setError(null)
    setStatusMessage('')

    try {
      const { data } = await apiClient.put('/user/messaging-settings', toPayload(settings))
      setStatusMessage('Ajustes guardados correctamente.')
      onSaved?.(data)
    } catch (requestError) {
      setError(getErrorMessage(requestError))
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Ajustes de mensajería">
      <form className="message-settings" onSubmit={handleSave} aria-busy={isSaving}>
        <div className="message-settings__list">
          {SETTINGS_FIELDS.map((field) => {
            const inputId = `${baseId}-${field.key}`
            const hintId = `${inputId}-hint`

            return (
              <div className="message-settings__item" key={field.key}>
                <label className="message-settings__toggle" htmlFor={inputId}>
                  <span className="message-settings__toggle-copy">
                    <span className="message-settings__label">{field.label}</span>
                    <span className="message-settings__hint" id={hintId}>
                      {field.hint}
                    </span>
                  </span>
                  <input
                    className="message-settings__checkbox"
                    id={inputId}
                    type="checkbox"
                    checked={settings[field.key]}
                    aria-describedby={hintId}
                    onChange={updateBooleanSetting(field.key)}
                  />
                  <span className="message-settings__switch" aria-hidden="true">
                    <span className="message-settings__switch-thumb" />
                  </span>
                </label>

                {field.key === 'autoSignature' && settings.autoSignature ? (
                  <div className="message-settings__conditional">
                    <label className="message-settings__field-label" htmlFor={`${baseId}-signature`}>
                      Firma automática
                    </label>
                    <textarea
                      className="message-settings__textarea"
                      id={`${baseId}-signature`}
                      rows="4"
                      value={settings.signature}
                      onChange={updateTextSetting('signature')}
                    />
                  </div>
                ) : null}

                {field.key === 'undoSend' && settings.undoSend ? (
                  <div className="message-settings__conditional">
                    <label className="message-settings__field-label" htmlFor={`${baseId}-undo-delay`}>
                      Tiempo para deshacer
                    </label>
                    <select
                      className="message-settings__select"
                      id={`${baseId}-undo-delay`}
                      value={settings.undoSendDelaySeconds}
                      onChange={updateTextSetting('undoSendDelaySeconds')}
                    >
                      {UNDO_SEND_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        {error ? (
          <p className="message-settings__feedback message-settings__feedback--error" role="alert">
            {error}
          </p>
        ) : null}

        {statusMessage ? (
          <p className="message-settings__feedback" role="status">
            {statusMessage}
          </p>
        ) : null}

        <div className="message-settings__actions">
          <button className="message-settings__button message-settings__button--secondary" type="button" onClick={onClose}>
            Cancelar
          </button>
          <button className="message-settings__button message-settings__button--primary" type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar ajustes'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default MessageSettingsModal