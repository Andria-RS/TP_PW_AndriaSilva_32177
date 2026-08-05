import { useEffect, useState } from 'react'
import { ALLOWED_THEMES } from '../constants/themes.js'

function CreateAlbumModal({
  isOpen,
  onClose,
  onSubmit,
  initialValues = {
    name: '',
    description: '',
    theme: '',
    isPublic: true,
    coverImageUrl: ''
  }
}) {
  const [form, setForm] = useState(initialValues)
  const [coverImageFile, setCoverImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  useEffect(() => {
    if (isOpen) {
      setForm(initialValues)
      setCoverImageFile(null)
      setImagePreview(initialValues.coverImageUrl || '')
    }
  }, [isOpen, initialValues])

  useEffect(() => {
    if (!coverImageFile) return

    const objectUrl = URL.createObjectURL(coverImageFile)
    setImagePreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [coverImageFile])

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const handleChange = (field, value) => {
    setForm((prev) => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit({
      ...form,
      coverImageFile,
      coverImageUrl: coverImageFile ? '' : form.coverImageUrl
    })
  }

  return (
    <div className="album-modal-backdrop" onClick={onClose}>
      <div className="album-modal" onClick={(event) => event.stopPropagation()}>
        <button type="button" className="album-modal-close" onClick={onClose}>
          ✕
        </button>

        <div className="album-modal-layout">
          <div className="album-modal-form-side">
            <span className="album-modal-kicker">Criar novo álbum</span>
            <h2>Organiza as tuas memórias num só lugar</h2>
            <p>
              Dá um nome ao álbum, escolhe um tema e define se queres mantê-lo
              público ou privado.
            </p>

            <form className="album-modal-form" onSubmit={handleSubmit}>
              <label>
                Nome do álbum
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Viagens pelo Mundo"
                  required
                />
              </label>

              <label>
                Descrição
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder="As minhas aventuras e viagens inesquecíveis."
                />
              </label>

              <label>
                Tema
                <select
                  value={form.theme}
                  onChange={(e) => handleChange('theme', e.target.value)}
                  required
                >
                  <option value="">Seleciona um tema</option>
                  {ALLOWED_THEMES.map((theme) => (
                    <option key={theme} value={theme}>
                      {theme}
                    </option>
                  ))}
                </select>
              </label>

              <div className="album-modal-visibility">
                <span>Visibilidade</span>

                <label className="radio-option">
                  <input
                    type="radio"
                    name="isPublic"
                    checked={form.isPublic === true}
                    onChange={() => handleChange('isPublic', true)}
                  />
                  <div>
                    <strong>Público</strong>
                    <small>Visível para qualquer pessoa</small>
                  </div>
                </label>

                <label className="radio-option">
                  <input
                    type="radio"
                    name="isPublic"
                    checked={form.isPublic === false}
                    onChange={() => handleChange('isPublic', false)}
                  />
                  <div>
                    <strong>Privado</strong>
                    <small>Apenas tu podes ver este álbum</small>
                  </div>
                </label>
              </div>

              <div className="album-modal-actions">
                <button type="button" className="album-modal-secondary" onClick={onClose}>
                  Cancelar
                </button>
                <button type="submit" className="album-modal-primary">
                  Criar álbum
                </button>
              </div>
            </form>
          </div>

          <div className="album-modal-preview-side">
            <div className="album-modal-preview-card">
              <div className="album-modal-preview-label">Imagem de capa</div>

              {imagePreview ? (
                <img src={imagePreview} alt="Pré-visualização da capa do álbum" />
              ) : (
                <div className="album-modal-preview-placeholder">
                  <span>Pré-visualização da imagem</span>
                </div>
              )}

              <div className="album-modal-upload-row">
                <label className="album-modal-upload-btn">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverImageFile(e.target.files?.[0] || null)}
                  />
                  {coverImageFile ? 'Alterar imagem' : 'Adicionar imagem'}
                </label>
              </div>

              {!coverImageFile && (
                <label className="album-modal-url">
                  Ou usa um URL da capa
                  <input
                    type="url"
                    value={form.coverImageUrl}
                    onChange={(e) => handleChange('coverImageUrl', e.target.value)}
                    placeholder="https://..."
                  />
                </label>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CreateAlbumModal