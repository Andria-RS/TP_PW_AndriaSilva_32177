import express from 'express'
import Photo from '../models/Photo.js'
import Album from '../models/Album.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

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

router.post('/', authenticate, async (req, res) => {
  try {
    const { title, imageUrl, description, albumId, isPublic } = req.body
    if (!title || !imageUrl) {
      return res.status(400).json({ message: 'Title e imageUrl são obrigatórios' })
    }

    const photoData = {
      title,
      imageUrl,
      description,
      theme: undefined,
      isPublic: isPublic !== false,
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

    if (!photoData.theme && req.body.theme) {
      photoData.theme = req.body.theme
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
