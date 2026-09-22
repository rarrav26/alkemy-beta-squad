export function buildProfilePayload(formData, currentEmail, currentPassword = '') {
  const payload = {
    nombre: formData.nombre,
    apellido: formData.apellido,
    email: formData.email
  }

  const emailCambio = currentEmail && formData.email && formData.email.trim().toLowerCase() !== currentEmail.trim().toLowerCase()

  if (emailCambio) {
    payload.currentPassword = currentPassword
  }

  return payload
}
