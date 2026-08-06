import { useEffect, useState } from 'react'
import { ALLOWED_THEMES } from '../constants/themes.js'

const DEFAULT_FORM = {
  name: '',
  description: '',
  theme: '',
  isPublic: true,
  coverImageUrl: ''
}

function CreateAlbumModal({
  isOpen,
  onClose,
  onSubmit,
  initialValues = DEFAULT_FORM
}) {
  const [form, setForm] = useState(DEFAULT_FORM)
  const [coverImageFile, setCoverImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  const isEditing = Boolean(initialValues?.name)

  useEffect(() => {
    if (!isOpen) return

    setForm({
      name: initialValues?.name || '',
      description: initialValues?.description || '',
      theme: initialValues?.theme || '',
      isPublic: typeof initialValues?.isPublic === 'boolean'
        ? initialValues.isPublic
        : true,
      coverImageUrl: initialValues?.coverImageUrl || ''
    })

    setCoverImageFile(null)
    setImagePreview(initialValues?.coverImageUrl || '')
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
    setForm((previous) => ({ ...previous, [field]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    await onSubmit({
      ...form,
      coverImageFile,
      coverImageUrl: coverImageFile ? '' : form.coverImageUrl
    })
  }

  return (
    <div className="album-create-backdrop">
      <div className="album-create-modal" role="dialog" aria-modal="true" aria-label={isEditing ? 'Editar álbum' : 'Criar novo álbum'}>
        <button type="button" className="album-create-close" onClick={onClose} aria-label="Fechar">
          ✕
        </button>

        <div className="album-create-layout">
          <div className="album-create-form-side">
            <span className="album-create-kicker">
              {isEditing ? 'Editar álbum' : 'Criar novo álbum'}
            </span>

            <h2>
              {isEditing
                ? 'Atualiza os dados do teu álbum'
                : 'Organiza as tuas memórias num só lugar'}
            </h2>

            <p>
              Dá um nome ao álbum, escolhe um tema e define se queres mantê-lo público ou privado.
            </p>

            <form className="album-create-form" onSubmit={handleSubmit}>
              <label className="album-create-field">
                Nome do álbum
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => handleChange('name', event.target.value)}
                  placeholder="Viagens pelo Mundo"
                  required
                />
              </label>

              <label className="album-create-field">
                Descrição
                <textarea
                  value={form.description}
                  onChange={(event) => handleChange('description', event.target.value)}
                  placeholder="As minhas aventuras e viagens inesquecíveis."
                />
              </label>

              <label className="album-create-field">
                Tema
                <select
                  value={form.theme}
                  onChange={(event) => handleChange('theme', event.target.value)}
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

              <fieldset className="album-create-fieldset">
                <legend>Visibilidade</legend>

                <label className="album-create-radio-option">
                  <input
                    type="radio"
                    name="album-visibility"
                    checked={form.isPublic}
                    onChange={() => handleChange('isPublic', true)}
                  />
                  <div>
                    <strong>Público</strong>
                    <span>Aberto a todos os utilizadores.</span>
                  </div>
                </label>

                <label className="album-create-radio-option">
                  <input
                    type="radio"
                    name="album-visibility"
                    checked={!form.isPublic}
                    onChange={() => handleChange('isPublic', false)}
                  />
                  <div>
                    <strong>Privado</strong>
                    <span>Apenas tu vês este álbum.</span>
                  </div>
                </label>
              </fieldset>

              <div className="album-create-actions">
                <button type="button" className="album-create-secondary" onClick={onClose}>
                  Cancelar
                </button>

                <button type="submit" className="album-create-primary">
                  {isEditing ? 'Confirmar' : 'Criar álbum'}
                </button>
              </div>
            </form>
          </div>

          <div className="album-create-preview-side">
            <div className="album-create-preview-card">
              <div className="album-create-preview-label">
                Imagem de capa
              </div>

              {imagePreview ? (
                <img src={imagePreview} alt="Pré-visualização da capa do álbum" />
              ) : (
                <div className="album-create-preview-placeholder">
                  Pré-visualização da imagem
                </div>
              )}

              <div className="album-create-upload-row">
                <label className="album-create-upload-btn">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setCoverImageFile(event.target.files?.[0] || null)}
                  />
                  {coverImageFile ? 'Alterar imagem' : 'Adicionar imagem'}
                </label>
              </div>

              {!coverImageFile && (
                <label className="album-create-url">
                  Ou usa um URL da capa
                  <input
                    type="url"
                    value={form.coverImageUrl}
                    onChange={(event) => handleChange('coverImageUrl', event.target.value)}
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