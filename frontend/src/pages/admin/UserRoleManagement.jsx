import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, RefreshCcw, Trash2 } from 'lucide-react'
import Modal from '../../components/Modal'
import { useAuth } from '../../context/authContext'
import { apiClient } from '../../services/apiClient'
import { dataItems, getErrorMessage, updateFormField } from './adminPageUtils'

const buildInitialForm = (role) => ({ name: '', email: '', role, password: 'Password123!', phone: '' })

const buildUserPayload = (form, role, mode) => {
  const payload = {
    name: form.name,
    email: form.email,
    role,
    phone: form.phone || null,
  }

  if (mode === 'create' || form.password.trim()) {
    payload.password = form.password
  }

  return payload
}

const RoleUserForm = ({ form, mode, onChange, onSubmit }) => (
  <form className="management__form management__grid" onSubmit={onSubmit}>
    <label className="management__field"><span>Nombre</span><input name="name" value={form.name} onChange={onChange} required /></label>
    <label className="management__field"><span>Email</span><input name="email" type="email" value={form.email} onChange={onChange} required /></label>
    <label className="management__field"><span>Teléfono</span><input name="phone" value={form.phone} onChange={onChange} /></label>
    <label className="management__field">
      <span>{mode === 'create' ? 'Contraseña' : 'Nueva contraseña'}</span>
      <input name="password" type="password" autoComplete="new-password" placeholder={mode === 'create' ? undefined : 'Dejar en blanco para mantenerla'} value={form.password} onChange={onChange} required={mode === 'create'} />
    </label>
    <button className="management__button management__button--primary" type="submit">{mode === 'create' ? 'Crear usuario' : 'Guardar cambios'}</button>
  </form>
)

const UserRoleManagement = ({ role, title, eyebrow, description, createLabel, emptyText }) => {
  const { refreshUser, user } = useAuth()
  const [users, setUsers] = useState([])
  const [form, setForm] = useState(() => buildInitialForm(role))
  const [editingUserId, setEditingUserId] = useState(null)
  const [modalMode, setModalMode] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await apiClient.get('/users', { params: { role, per_page: 100 } })
      setUsers(dataItems(response))
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudieron cargar los usuarios.'))
    } finally {
      setIsLoading(false)
    }
  }, [role])

  useEffect(() => {
    Promise.resolve().then(loadUsers)
  }, [loadUsers])

  const openCreateModal = () => {
    setForm(buildInitialForm(role))
    setEditingUserId(null)
    setModalMode('create')
    setFeedback('')
  }

  const openEditModal = (selectedUser) => {
    setForm({ name: selectedUser.name ?? '', email: selectedUser.email ?? '', role, password: '', phone: selectedUser.phone ?? '' })
    setEditingUserId(selectedUser.id)
    setModalMode('edit')
    setFeedback('')
  }

  const closeModal = () => {
    setModalMode(null)
    setEditingUserId(null)
    setForm(buildInitialForm(role))
  }

  const saveUser = async (event) => {
    event.preventDefault()

    try {
      if (modalMode === 'edit' && editingUserId) {
        const { data } = await apiClient.put(`/users/${editingUserId}`, buildUserPayload(form, role, 'edit'))
        setUsers((currentUsers) => currentUsers.map((item) => (item.id === data.id ? data : item)))
        if (data.id === user?.id) {
          await refreshUser()
        }
        setFeedback('Usuario actualizado correctamente.')
      } else {
        const { data } = await apiClient.post('/users', buildUserPayload(form, role, 'create'))
        setUsers((currentUsers) => [data, ...currentUsers])
        setFeedback('Usuario creado correctamente.')
      }

      closeModal()
    } catch (requestError) {
      setFeedback(getErrorMessage(requestError, 'No se pudo guardar el usuario.'))
    }
  }

  const deleteUser = async (selectedUser) => {
    if (!window.confirm('¿Eliminar este usuario?')) {
      return
    }

    try {
      await apiClient.delete(`/users/${selectedUser.id}`)
      setUsers((currentUsers) => currentUsers.filter((item) => item.id !== selectedUser.id))
      setFeedback('Usuario eliminado correctamente.')
    } catch (requestError) {
      setFeedback(getErrorMessage(requestError, 'No se pudo eliminar el usuario.'))
    }
  }

  return (
    <section className="management management__page" aria-labelledby={`${role}-users-title`}>
      <header className="management__header">
        <div>
          <p className="management__eyebrow">{eyebrow}</p>
          <h1 className="management__title" id={`${role}-users-title`}>{title}</h1>
          <p className="management__subtitle">{description}</p>
        </div>
        <div className="management__actions">
          <button className="management__button management__button--secondary" type="button" onClick={loadUsers} disabled={isLoading}><RefreshCcw size={16} aria-hidden="true" />Actualizar</button>
          <button className="management__button management__button--primary" type="button" onClick={openCreateModal}><Plus size={16} aria-hidden="true" />{createLabel}</button>
        </div>
      </header>

      {feedback ? <p className="management__feedback" role="status">{feedback}</p> : null}
      {error ? <p className="management__notice" role="alert">{error}</p> : null}

      <section className="management__section" aria-busy={isLoading}>
        <div className="management__table-wrap">
          <table className="management__table">
            <thead><tr><th>Usuario</th><th>Rol</th><th>Contacto</th><th>Acciones</th></tr></thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.name}</strong><p className="management__table-meta">{item.email}</p></td>
                  <td><span className="management__badge">{item.role}</span></td>
                  <td>{item.phone ?? '-'}</td>
                  <td>
                    <div className="management__row-actions">
                      <button className="management__button management__button--secondary" type="button" onClick={() => openEditModal(item)}><Pencil size={15} aria-hidden="true" />Editar</button>
                      <button className="management__button management__button--danger" type="button" disabled={item.id === user?.id} onClick={() => deleteUser(item)}><Trash2 size={15} aria-hidden="true" />Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isLoading && users.length === 0 ? <p className="management__empty">{emptyText}</p> : null}
      </section>

      <Modal isOpen={Boolean(modalMode)} onClose={closeModal} title={modalMode === 'edit' ? `Editar ${title.toLowerCase()}` : createLabel}>
        <RoleUserForm form={form} mode={modalMode ?? 'create'} onChange={updateFormField(setForm)} onSubmit={saveUser} />
      </Modal>
    </section>
  )
}

export default UserRoleManagement