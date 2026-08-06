import express from 'express'
import multer from 'multer'
import cloudinary from '../config/cloudinary.js'
import Album from '../models/Album.js'
import Photo from '../models/Photo.js'
import Comment from '../models/Comment.js'
import Like from '../models/Like.js'
import { authenticate, optionalAuthenticate } from '../middleware/auth.js'

const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
})

const uploadToCloudinary = (fileBuffer, folder = 'albums') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      }
    )

    stream.end(fileBuffer)
  })
}

router.get('/', async (req, res) => {
  try {
    const { theme, owner } = req.query
    const filter = { isPublic: true }

    if (theme) filter.theme = new RegExp(theme, 'i')
    if (owner) filter.owner = owner

    const albums = await Album.find(filter)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })

    res.json(albums)
  } catch (error) {
    console.error('Erro ao carregar álbuns:', error)
    res.status(500).json({ message: 'Erro ao carregar álbuns', error: error.message })
  }
})

router.get('/mine', authenticate, async (req, res) => {
  try {
    const albums = await Album.find({ owner: req.user._id }).sort({ createdAt: -1 })
    res.json(albums)
  } catch (error) {
    console.error('Erro ao carregar os seus álbuns:', error)
    res.status(500).json({ message: 'Erro ao carregar os seus álbuns', error: error.message })
  }
})

router.post('/', authenticate, upload.single('coverImage'), async (req, res) => {
  try {
    const { name, description, theme, isPublic, coverImageUrl } = req.body

    if (!name || !theme) {
      return res.status(400).json({ message: 'Nome e tema são obrigatórios' })
    }

    let finalCoverImageUrl = coverImageUrl || ''
    let finalCoverImagePublicId = ''

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'albums')
      finalCoverImageUrl = uploadResult.secure_url
      finalCoverImagePublicId = uploadResult.public_id
    }

    const album = await Album.create({
      name,
      description,
      theme,
      coverImageUrl: finalCoverImageUrl,
      coverImagePublicId: finalCoverImagePublicId,
      isPublic: isPublic !== 'false' && isPublic !== false,
      owner: req.user._id
    })

    res.status(201).json(album)
  } catch (error) {
    console.error('Erro ao criar álbum:', error)
    res.status(500).json({ message: 'Erro ao criar álbum', error: error.message })
  }
})

router.put('/:albumId', authenticate, upload.single('coverImage'), async (req, res) => {
  try {
    const { albumId } = req.params
    const album = await Album.findById(albumId)

    if (!album) {
      return res.status(404).json({ message: 'Álbum não encontrado' })
    }

    if (!album.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Não tem permissão' })
    }

    const { name, description, theme, isPublic, coverImageUrl } = req.body

    album.name = name ?? album.name
    album.description = description ?? album.description
    album.theme = theme ?? album.theme

    if (typeof isPublic !== 'undefined') {
      album.isPublic = isPublic !== 'false' && isPublic !== false
    }

    if (req.file) {
      if (album.coverImagePublicId) {
        await cloudinary.uploader.destroy(album.coverImagePublicId)
      }

      const uploadResult = await uploadToCloudinary(req.file.buffer, 'albums')
      album.coverImageUrl = uploadResult.secure_url
      album.coverImagePublicId = uploadResult.public_id
    } else if (typeof coverImageUrl !== 'undefined') {
      album.coverImageUrl = coverImageUrl
      album.coverImagePublicId = ''
    }

    await album.save()

    res.json(album)
  } catch (error) {
    console.error('Erro ao atualizar álbum:', error)
    res.status(500).json({ message: 'Erro ao atualizar álbum', error: error.message })
  }
})

router.delete('/:albumId', authenticate, async (req, res) => {
  try {
    const { albumId } = req.params
    const album = await Album.findById(albumId)

    if (!album) {
      return res.status(404).json({ message: 'Álbum não encontrado' })
    }

    if (!album.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Não tem permissão' })
    }

    const photos = await Photo.find({ album: album._id }).select('_id imagePublicId')
    const photoIds = photos.map((photo) => photo._id)

    if (photoIds.length > 0) {
      await Comment.deleteMany({ photo: { $in: photoIds } })
      await Like.deleteMany({ photo: { $in: photoIds } })
      await Photo.deleteMany({ _id: { $in: photoIds } })

      for (const photo of photos) {
        if (photo.imagePublicId) {
          await cloudinary.uploader.destroy(photo.imagePublicId)
        }
      }
    }

    if (album.coverImagePublicId) {
      await cloudinary.uploader.destroy(album.coverImagePublicId)
    }

    await album.deleteOne()

    res.json({
      message: 'Álbum, fotos e dados associados eliminados',
      deletedPhotos: photoIds.length
    })
  } catch (error) {
    console.error('Erro ao eliminar álbum:', error)
    res.status(500).json({ message: 'Erro ao eliminar álbum', error: error.message })
  }
})

router.get('/:albumId', optionalAuthenticate, async (req, res) => {
  try {
    const album = await Album.findById(req.params.albumId).populate('owner', 'name email')

    if (!album) {
      return res.status(404).json({ message: 'Álbum não encontrado' })
    }

    if (!album.isPublic && (!req.user || !album.owner._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Álbum privado' })
    }

    const photos = await Photo.find({ album: album._id })
      .populate('author', 'name email')
      .sort({ createdAt: -1 })

    res.json({ album, photos })
  } catch (error) {
    console.error('Erro ao carregar álbum:', error)
    res.status(500).json({ message: 'Erro ao carregar álbum', error: error.message })
  }
})

export default router