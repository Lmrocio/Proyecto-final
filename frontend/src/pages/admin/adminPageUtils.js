export const dataItems = (response) => (Array.isArray(response?.data?.data) ? response.data.data : [])

export const getErrorMessage = (error, fallback) => error?.response?.data?.message ?? fallback

export const updateFormField = (setter) => (event) => {
  const { name, value } = event.target
  setter((currentForm) => ({ ...currentForm, [name]: value }))
}

export const formatDate = (value) => {
  if (!value) {
    return '-'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return '-'
  }

  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}