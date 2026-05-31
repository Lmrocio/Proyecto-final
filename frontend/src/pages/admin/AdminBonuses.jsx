import { useCallback, useEffect, useState } from 'react'
import { Pencil, Plus, RefreshCcw, Trash2 } from 'lucide-react'
import Modal from '../../components/Modal'
import { apiClient } from '../../services/apiClient'
import { dataItems, getErrorMessage, updateFormField } from './adminPageUtils'

const initialBonusForm = { name: '', type: 'monthly', price: '120', description: '' }

const BonusForm = ({ form, onChange, onSubmit }) => (
  <form className="management__form management__grid" onSubmit={onSubmit}>
    <label className="management__field"><span>Nombre</span><input name="name" value={form.name} onChange={onChange} required /></label>
    <label className="management__field"><span>Tipo</span><select name="type" value={form.type} onChange={onChange}><option value="monthly">Mensual</option><option value="pack">Pack</option></select></label>
    <label className="management__field"><span>Precio</span><input name="price" type="number" min="0" value={form.price} onChange={onChange} required /></label>
    <label className="management__field"><span>Descripción</span><input name="description" value={form.description} onChange={onChange} /></label>
    <button className="management__button management__button--primary" type="submit">Guardar bono</button>
  </form>
)

const AdminBonuses = () => {
  const [bonuses, setBonuses] = useState([])
  const [bonusForm, setBonusForm] = useState(initialBonusForm)
  const [editingBonusId, setEditingBonusId] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')

  const loadBonuses = useCallback(async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await apiClient.get('/bonuses', { params: { per_page: 100 } })
      setBonuses(dataItems(response))
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'No se pudieron cargar los bonos.'))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    Promise.resolve().then(loadBonuses)
  }, [loadBonuses])

  const openCreateModal = () => {
    setBonusForm(initialBonusForm)
    setEditingBonusId(null)
    setIsModalOpen(true)
  }

  const openEditModal = (bonus) => {
    setBonusForm({ name: bonus.name ?? '', type: bonus.type ?? 'monthly', price: String(bonus.price ?? '0'), description: bonus.description ?? '' })
    setEditingBonusId(bonus.id)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingBonusId(null)
    setBonusForm(initialBonusForm)
  }

  const saveBonus = async (event) => {
    event.preventDefault()
    const payload = { ...bonusForm, price: Number(bonusForm.price) }

    try {
      if (editingBonusId) {
        const { data } = await apiClient.put(`/bonuses/${editingBonusId}`, payload)
        setBonuses((currentBonuses) => currentBonuses.map((bonus) => (bonus.id === data.id ? data : bonus)))
        setFeedback('Bono actualizado correctamente.')
      } else {
        const { data } = await apiClient.post('/bonuses', payload)
        setBonuses((currentBonuses) => [data, ...currentBonuses])
        setFeedback('Bono creado correctamente.')
      }
      closeModal()
    } catch (requestError) {
      setFeedback(getErrorMessage(requestError, 'No se pudo guardar el bono.'))
    }
  }

  const deleteBonus = async (bonus) => {
    if (!window.confirm('¿Eliminar este bono?')) {
      return
    }
    try {
      await apiClient.delete(`/bonuses/${bonus.id}`)
      setBonuses((currentBonuses) => currentBonuses.filter((item) => item.id !== bonus.id))
      setFeedback('Bono eliminado correctamente.')
    } catch (requestError) {
      setFeedback(getErrorMessage(requestError, 'No se pudo eliminar el bono.'))
    }
  }

  return (
    <section className="management management__page" aria-labelledby="admin-bonuses-title">
      <header className="management__header"><div><p className="management__eyebrow">Comercial</p><h1 className="management__title" id="admin-bonuses-title">Bonos</h1><p className="management__subtitle">Gestiona tarifas y paquetes asociados a cursos.</p></div><div className="management__actions"><button className="management__button management__button--secondary" type="button" onClick={loadBonuses} disabled={isLoading}><RefreshCcw size={16} aria-hidden="true" />Actualizar</button><button className="management__button management__button--primary" type="button" onClick={openCreateModal}><Plus size={16} aria-hidden="true" />Nuevo bono</button></div></header>
      {feedback ? <p className="management__feedback" role="status">{feedback}</p> : null}
      {error ? <p className="management__notice" role="alert">{error}</p> : null}
      <section className="management__section" aria-busy={isLoading}><div className="management__table-wrap"><table className="management__table"><thead><tr><th>Bono</th><th>Tipo</th><th>Precio</th><th>Acciones</th></tr></thead><tbody>{bonuses.map((bonus) => <tr key={bonus.id}><td><strong>{bonus.name}</strong><p className="management__table-meta">{bonus.description ?? '-'}</p></td><td><span className="management__badge">{bonus.type}</span></td><td>{bonus.price} €</td><td><div className="management__row-actions"><button className="management__button management__button--secondary" type="button" onClick={() => openEditModal(bonus)}><Pencil size={15} aria-hidden="true" />Editar</button><button className="management__button management__button--danger" type="button" onClick={() => deleteBonus(bonus)}><Trash2 size={15} aria-hidden="true" />Eliminar</button></div></td></tr>)}</tbody></table></div></section>
      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingBonusId ? 'Editar bono' : 'Nuevo bono'}><BonusForm form={bonusForm} onChange={updateFormField(setBonusForm)} onSubmit={saveBonus} /></Modal>
    </section>
  )
}

export default AdminBonuses