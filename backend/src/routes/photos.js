import express from 'express'
import multer from 'multer'
import cloudinary from '../config/cloudinary.js'
import Photo from '../models/Photo.js'
import Album from '../models/Album.js'
import Comment from '../models/Comment.js'
import Like from '../models/Like.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

const storage = multer.memoryStorage()
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }
})

const uploadToCloudinary = (fileBuffer, folder = 'photos') => {
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
    const { theme, albumId } = req.query
    const filter = { isPublic: true }

    if (theme) filter.theme = new RegExp(theme, 'i')
    if (albumId) filter.album = albumId

    const photos = await Photo.find(filter)
      .populate('album', 'name theme owner isPublic')
      .populate('author', 'name email')
      .sort({ createdAt: -1 })

    res.json(photos)
  } catch (error) {
    console.error('Erro ao carregar fotos:', error)
    res.status(500).json({ message: 'Erro ao carregar fotos', error: error.message })
  }
})

router.get('/mine', authenticate, async (req, res) => {
  try {
    const photos = await Photo.find({ author: req.user._id })
      .populate('album', 'name theme isPublic')
      .sort({ createdAt: -1 })

    res.json(photos)
  } catch (error) {
    console.error('Erro ao carregar as suas fotos:', error)
    res.status(500).json({ message: 'Erro ao carregar as suas fotos', error: error.message })
  }
})

router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    const { title, description, albumId, isPublic, theme, imageUrl } = req.body

    if (!title) {
      return res.status(400).json({ message: 'Título é obrigatório' })
    }

    let finalImageUrl = imageUrl || ''
    let finalImagePublicId = ''

    if (req.file) {
      const uploadResult = await uploadToCloudinary(req.file.buffer, 'photos')
      finalImageUrl = uploadResult.secure_url
      finalImagePublicId = uploadResult.public_id
    }

    if (!finalImageUrl) {
      return res.status(400).json({ message: 'Imagem é obrigatória' })
    }

    const photoData = {
      title,
      imageUrl: finalImageUrl,
      imagePublicId: finalImagePublicId,
      description,
      theme: undefined,
      isPublic: isPublic !== 'false' && isPublic !== false,
      author: req.user._id
    }

    if (albumId) {
      const album = await Album.findById(albumId)
      if (!album) return res.status(404).json({ message: 'Álbum não encontrado' })
      if (!album.isPublic && !album.owner.equals(req.user._id)) {
        return res.status(403).json({ message: 'Não pode adicionar foto a álbum privado de outro utilizador' })
      }
      photoData.album = album._id
      photoData.theme = album.theme
    }

    if (!photoData.theme && theme) {
      photoData.theme = theme
    }

    if (!photoData.theme) {
      return res.status(400).json({ message: 'Tema é obrigatório, pelo álbum ou explicitamente' })
    }

    const photo = await Photo.create(photoData)
    res.status(201).json(photo)
  } catch (error) {
    console.error('Erro ao criar foto:', error)
    res.status(500).json({ message: 'Erro ao criar foto', error: error.message })
  }
})

router.delete('/:photoId', authenticate, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.photoId)

    if (!photo) {
      return res.status(404).json({ message: 'Foto não encontrada' })
    }

    if (!photo.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'Não tem permissão' })
    }

    await Comment.deleteMany({ photo: photo._id })
    await Like.deleteMany({ photo: photo._id })

    if (photo.imagePublicId) {
      await cloudinary.uploader.destroy(photo.imagePublicId)
    }

    await photo.deleteOne()

    res.json({ message: 'Foto eliminada' })
  } catch (error) {
    console.error('Erro ao eliminar foto:', error)
    res.status(500).json({ message: 'Erro ao eliminar foto', error: error.message })
  }
})

export default router