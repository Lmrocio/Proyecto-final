export const dataItems = (response) => (Array.isArray(response?.data?.data) ? response.data.data : [])

export const getErrorMessage = (error, fallback) => error?.response?.data?.message ?? fallback

export const updateFormField = (setter) => (event) => {
  const { name, value } = event.target
  setter((currentForm) => ({ ...currentForm, [name]: value }))
}

export const getUserFirstName = (user) => String(user?.first_name ?? user?.name?.split?.(/\s+/)?.[0] ?? '').trim()

export const getUserLastName = (user) => {
  const currentLastName = String(user?.last_name ?? '').trim()

  if (currentLastName) {
    return currentLastName
  }

  const [, derivedLastName = ''] = String(user?.name ?? '').trim().split(/\s+/, 2)

  return derivedLastName
}

export const getUserFullName = (user) => {
  const fullName = `${getUserFirstName(user)} ${getUserLastName(user)}`.trim()

  return fullName || user?.name || '-'
}

export const getUserSortableName = (user) => {
  const firstName = getUserFirstName(user)
  const lastName = getUserLastName(user)

  return lastName ? `${lastName}, ${firstName}` : firstName || user?.name || '-'
}

export const normalizeSearchText = (value) => String(value ?? '').trim().toLocaleLowerCase('es-ES')

export const roleLabels = {
  student: 'Alumno',
  teacher: 'Docente',
  admin: 'Administrador',
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