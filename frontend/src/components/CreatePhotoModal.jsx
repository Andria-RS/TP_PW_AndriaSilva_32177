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
      isPublic:
        typeof initialValues?.isPublic === 'boolean'
          ? initialValues.isPublic
          : true,
      imageUrl: initialValues?.imageUrl ?? ''
    })

    setPhotoFile(null)
    setImagePreview(initialValues?.imageUrl || '')
  }, [isOpen, initialValues])

  useEffect(() => {
    if (!photoFile) return

    const objectUrl = URL.createObjectURL(photoFile)
    setImagePreview(objectUrl)

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [photoFile])

  useEffect(() => {
    if (!isOpen) return

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const selectedAlbum = albums.find(
    (album) => album._id === form.albumId
  )

  const selectedAlbumTheme = selectedAlbum?.theme || ''

  const handleChange = (field, value) => {
    setForm((previous) => ({
      ...previous,
      [field]: value
    }))
  }

  const handleAlbumChange = (event) => {
    const albumId = event.target.value

    const album = albums.find(
      (item) => item._id === albumId
    )

    setForm((previous) => ({
      ...previous,
      albumId,
      theme: album?.theme || ''
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!form.albumId) {
      return
    }

    if (!photoFile && !form.imageUrl) {
      return
    }

    await onSubmit({
      title: form.title,
      description: form.description,
      albumId: form.albumId,
      theme: selectedAlbumTheme,
      isPublic: form.isPublic,
      photoFile,
      imageUrl: photoFile ? '' : form.imageUrl
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
                onChange={(event) => {
                  setPhotoFile(
                    event.target.files?.[0] || null
                  )
                }}
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
                handleChange('title', event.target.value)
              }
              placeholder="Lago nas Montanhas"
              required
            />
          </label>

          <label>
            Descrição

            <textarea
              value={form.description}
              onChange={(event) =>
                handleChange('description', event.target.value)
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
                </option>
              ))}
            </select>
          </label>

          <label>
            Tema do álbum

            <input
              type="text"
              value={selectedAlbumTheme}
              placeholder="O tema será preenchido pelo álbum"
              readOnly
              disabled={!form.albumId}
            />

            <small className="photo-create-help-text">
              O tema é definido automaticamente pelo álbum selecionado.
            </small>
          </label>

          <label>
            Visibilidade

            <select
              value={form.isPublic ? 'public' : 'private'}
              onChange={(event) =>
                handleChange(
                  'isPublic',
                  event.target.value === 'public'
                )
              }
            >
              <option value="public">
                Público
              </option>

              <option value="private">
                Privado
              </option>
            </select>
          </label>

          {!photoFile && (
            <label>
              Ou usa um URL da imagem

              <input
                type="url"
                value={form.imageUrl}
                onChange={(event) =>
                  handleChange('imageUrl', event.target.value)
                }
                placeholder="https://..."
              />
            </label>
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