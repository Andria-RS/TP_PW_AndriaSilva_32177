import { useEffect, useState } from 'react'

const defaultInitialValues = {
  title: '',
  description: '',
  albumId: '',
  theme: '',
  isPublic: true,
  imageUrl: ''
}

function CreatePhotoModal({
  isOpen,
  onClose,
  onSubmit,
  albums = [],
  initialValues = defaultInitialValues
}) {
  const [form, setForm] = useState(defaultInitialValues)
  const [photoFile, setPhotoFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')

  useEffect(() => {
    if (!isOpen) return

    setForm({
      title: initialValues?.title ?? '',
      description: initialValues?.description ?? '',
      albumId: initialValues?.albumId ?? '',
      theme: initialValues?.theme ?? '',
      isPublic: typeof initialValues?.isPublic === 'boolean' ? initialValues.isPublic : true,
      imageUrl: initialValues?.imageUrl ?? ''
    })
    setPhotoFile(null)
    setImagePreview(initialValues?.imageUrl || '')
  }, [isOpen])

  useEffect(() => {
    if (!photoFile) return

    const objectUrl = URL.createObjectURL(photoFile)
    setImagePreview(objectUrl)

    return () => URL.revokeObjectURL(objectUrl)
  }, [photoFile])

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

    const selectedAlbum = albums.find((album) => album._id === form.albumId)
    const finalTheme = selectedAlbum?.theme || form.theme

    onSubmit({
      title: form.title,
      description: form.description,
      albumId: form.albumId,
      theme: finalTheme,
      isPublic: form.isPublic,
      photoFile,
      imageUrl: photoFile ? '' : form.imageUrl
    })
  }

  return (
    <div className="photo-create-backdrop">
      <div className="photo-create-modal" role="dialog" aria-modal="true" aria-label="Adicionar fotografia">
        <button type="button" className="photo-create-close" onClick={onClose}>
          ✕
        </button>

        <h2>Adicionar fotografia</h2>

        <div className="photo-create-layout">
          <div className="photo-create-upload-side">
            <label className="photo-create-upload-box">
              <input
                className="photo-create-file-input"
                type="file"
                accept="image/*"
                onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
              />
              <div>
                <strong>Arrasta uma fotografia para aqui</strong>
                <span>ou clica para escolher</span>
              </div>
              <span className="photo-create-file-button">Selecionar ficheiro</span>
            </label>
          </div>

          <div className="photo-create-preview-side">
            {imagePreview ? (
              <img src={imagePreview} alt="Pré-visualização da fotografia" />
            ) : (
              <div className="photo-create-preview-placeholder">
                Pré-visualização da imagem
              </div>
            )}
          </div>
        </div>

        <form className="photo-create-form" onSubmit={handleSubmit}>
          <label>
            Título
            <input
              type="text"
              value={form.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Lago nas Montanhas"
              required
            />
          </label>

          <label>
            Descrição
            <textarea
              value={form.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Uma viagem inesquecível entre montanhas e rios."
            />
          </label>

          <label>
            Álbum
            <select
              value={form.albumId}
              onChange={(e) => handleChange('albumId', e.target.value)}
              required
            >
              <option value="">Seleciona um álbum</option>
              {albums.map((album) => (
                <option key={album._id} value={album._id}>
                  {album.name}
                </option>
              ))}
            </select>
          </label>

          {!form.albumId && (
            <label>
              Tema
              <input
                type="text"
                value={form.theme}
                onChange={(e) => handleChange('theme', e.target.value)}
                placeholder="Ex: Viagens"
                required={!form.albumId}
              />
            </label>
          )}

          <label>
            Visibilidade
            <select
              value={form.isPublic ? 'public' : 'private'}
              onChange={(e) => handleChange('isPublic', e.target.value === 'public')}
            >
              <option value="public">Público</option>
              <option value="private">Privado</option>
            </select>
          </label>

          {!photoFile && (
            <label>
              Ou usa um URL da imagem
              <input
                type="url"
                value={form.imageUrl}
                onChange={(e) => handleChange('imageUrl', e.target.value)}
                placeholder="https://..."
              />
            </label>
          )}

          <div className="photo-create-actions">
            <button type="button" className="photo-create-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="photo-create-primary">
              Publicar fotografia
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePhotoModal