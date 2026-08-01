import express from 'express'
import fs from 'fs'
import path from 'path'
import multer from 'multer'
import Photo from '../models/Photo.js'
import Album from '../models/Album.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

const uploadDir = path.resolve(process.cwd(), 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`)
  }
})

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } })

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
    res.status(500).json({ message: 'Erro ao carregar as suas fotos', error: error.message })
  }
})

router.post('/', authenticate, upload.single('image'), async (req, res) => {
  try {
    const { title, description, albumId, isPublic, theme } = req.body
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.imageUrl

    if (!title || !imageUrl) {
      return res.status(400).json({ message: 'Título e imagem são obrigatórios' })
    }

    const photoData = {
      title,
      imageUrl,
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
    res.status(500).json({ message: 'Erro ao criar foto', error: error.message })
  }
})

export default router
