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
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!isOpen) {
      return
    }

    setForm({
      title: initialValues?.title || '',
      description: initialValues?.description || '',
      albumId: initialValues?.albumId || '',
      theme: initialValues?.theme || '',
      isPublic:
        typeof initialValues?.isPublic === 'boolean'
          ? initialValues.isPublic
          : true,
      imageUrl: initialValues?.imageUrl || ''
    })

    setPhotoFile(null)
    setImagePreview(initialValues?.imageUrl || '')
    setErrorMessage('')
  }, [isOpen, initialValues])

  useEffect(() => {
    if (!photoFile) {
      return
    }

    const objectUrl = URL.createObjectURL(photoFile)

    setImagePreview(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [photoFile])

  useEffect(() => {
    if (!isOpen) {
      return
    }

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape
      )

      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  const selectedAlbum = albums.find(
    (album) =>
      String(album._id) === String(form.albumId)
  )

  const selectedAlbumTheme =
    selectedAlbum?.theme || ''

  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value
    }))
  }

  const handleAlbumChange = (event) => {
    const albumId = event.target.value

    const album = albums.find(
      (item) =>
        String(item._id) === String(albumId)
    )

    setForm((previous) => ({
      ...previous,
      albumId,
      theme: album?.theme || ''
    }))
  }

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null

    setPhotoFile(file)
    setErrorMessage('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')

    if (!form.title.trim()) {
      setErrorMessage(
        'Introduz um título para a fotografia.'
      )
      return
    }

    if (!form.albumId) {
      setErrorMessage(
        'Seleciona um álbum para a fotografia.'
      )
      return
    }

    if (!photoFile && !form.imageUrl.trim()) {
      setErrorMessage(
        'Seleciona uma fotografia ou introduz um URL.'
      )
      return
    }

    await onSubmit({
      title: form.title.trim(),
      description: form.description.trim(),
      albumId: form.albumId,
      theme: selectedAlbumTheme,
      isPublic: form.isPublic,
      photoFile,
      imageUrl: photoFile
        ? ''
        : form.imageUrl.trim()
    })
  }

  return (
    <div className="photo-create-backdrop">
      <div
        className="photo-create-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Adicionar fotografia"
      >
        <button
          type="button"
          className="photo-create-close"
          onClick={onClose}
          aria-label="Fechar"
        >
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
                onChange={handleFileChange}
              />

              <div>
                <strong>
                  Arrasta uma fotografia para aqui
                </strong>

                <span>
                  ou clica para escolher
                </span>
              </div>

              <span className="photo-create-file-button">
                {photoFile
                  ? 'Alterar ficheiro'
                  : 'Selecionar ficheiro'}
              </span>
            </label>
          </div>

          <div className="photo-create-preview-side">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Pré-visualização da fotografia"
              />
            ) : (
              <div className="photo-create-preview-placeholder">
                Pré-visualização da imagem
              </div>
            )}
          </div>
        </div>

        <form
          className="photo-create-form"
          onSubmit={handleSubmit}
        >
          <label>
            Título

            <input
              type="text"
              value={form.title}
              onChange={(event) =>
                handleChange(
                  'title',
                  event.target.value
                )
              }
              placeholder="Lago nas montanhas"
              required
            />
          </label>

          <label>
            Descrição

            <textarea
              value={form.description}
              onChange={(event) =>
                handleChange(
                  'description',
                  event.target.value
                )
              }
              placeholder="Uma viagem inesquecível entre montanhas e rios."
            />
          </label>

          <label>
            Álbum

            <select
              value={form.albumId}
              onChange={handleAlbumChange}
              required
            >
              <option value="">
                Seleciona um álbum
              </option>

              {albums.map((album) => (
                <option
                  key={album._id}
                  value={album._id}
                >
                  {album.name}
                  {album.isPublic === false
                    ? ' — Privado'
                    : ' — Público'}
                </option>
              ))}
            </select>
          </label>

          <label>
            Tema do álbum

            <input
              type="text"
              value={selectedAlbumTheme}
              placeholder="Seleciona primeiro um álbum"
              readOnly
              disabled={!form.albumId}
            />

            <small className="photo-create-help-text">
              O tema é preenchido automaticamente pelo
              álbum selecionado.
            </small>
          </label>

          <fieldset className="album-create-fieldset">
            <legend>
              Visibilidade da fotografia
            </legend>

            <label className="album-create-radio-option">
              <input
                type="radio"
                name="photo-visibility"
                checked={form.isPublic === true}
                onChange={() =>
                  handleChange('isPublic', true)
                }
              />

              <div>
                <strong>Público</strong>
                <span>
                  Aberta a todos os utilizadores.
                </span>
              </div>
            </label>

            <label className="album-create-radio-option">
              <input
                type="radio"
                name="photo-visibility"
                checked={form.isPublic === false}
                onChange={() =>
                  handleChange('isPublic', false)
                }
              />

              <div>
                <strong>Privado</strong>
                <span>
                  Apenas tu vês esta fotografia.
                </span>
              </div>
            </label>
          </fieldset>

          {!photoFile && (
            <label>
              Ou usa um URL da imagem

              <input
                type="url"
                value={form.imageUrl}
                onChange={(event) =>
                  handleChange(
                    'imageUrl',
                    event.target.value
                  )
                }
                placeholder="https://..."
              />
            </label>
          )}

          {errorMessage && (
            <p className="status-message">
              {errorMessage}
            </p>
          )}

          <div className="photo-create-actions">
            <button
              type="button"
              className="photo-create-secondary"
              onClick={onClose}
            >
              Cancelar
            </button>

            <button
              type="submit"
              className="photo-create-primary"
              disabled={albums.length === 0}
            >
              Publicar fotografia
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreatePhotoModal