import express from 'express'
import Album from '../models/Album.js'
import Photo from '../models/Photo.js'
import { authenticate, optionalAuthenticate } from '../middleware/auth.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const { theme, owner } = req.query
    const filter = { isPublic: true }
    if (theme) filter.theme = new RegExp(theme, 'i')
    if (owner) filter.owner = owner

    const albums = await Album.find(filter).populate('owner', 'name email').sort({ createdAt: -1 })
    res.json(albums)
  } catch (error) {
    res.status(500).json({ message: 'Erro ao carregar álbuns', error: error.message })
  }
})

router.get('/mine', authenticate, async (req, res) => {
  try {
    const albums = await Album.find({ owner: req.user._id }).sort({ createdAt: -1 })
    res.json(albums)
  } catch (error) {
    res.status(500).json({ message: 'Erro ao carregar os seus álbuns', error: error.message })
  }
})

router.post('/', authenticate, async (req, res) => {
  try {
    const { name, description, theme, isPublic } = req.body
    if (!name || !theme) {
      return res.status(400).json({ message: 'Nome e tema são obrigatórios' })
    }

    const album = await Album.create({
      name,
      description,
      theme,
      isPublic: isPublic !== false,
      owner: req.user._id
    })

    res.status(201).json(album)
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar álbum', error: error.message })
  }
})

router.put('/:albumId', authenticate, async (req, res) => {
  try {
    const { albumId } = req.params
    const album = await Album.findById(albumId)
    if (!album) return res.status(404).json({ message: 'Álbum não encontrado' })
    if (!album.owner.equals(req.user._id)) return res.status(403).json({ message: 'Não tem permissão' })

    const { name, description, theme, isPublic } = req.body
    album.name = name ?? album.name
    album.description = description ?? album.description
    album.theme = theme ?? album.theme
    album.isPublic = isPublic ?? album.isPublic
    await album.save()

    res.json(album)
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar álbum', error: error.message })
  }
})

router.delete('/:albumId', authenticate, async (req, res) => {
  try {
    const { albumId } = req.params
    const album = await Album.findById(albumId)
    if (!album) return res.status(404).json({ message: 'Álbum não encontrado' })
    if (!album.owner.equals(req.user._id)) return res.status(403).json({ message: 'Não tem permissão' })

    await Photo.updateMany({ album: album._id }, { $unset: { album: '' } })
    await album.deleteOne()

    res.json({ message: 'Álbum eliminado' })
  } catch (error) {
    res.status(500).json({ message: 'Erro ao eliminar álbum', error: error.message })
  }
})

router.get('/:albumId', optionalAuthenticate, async (req, res) => {
  try {
    const album = await Album.findById(req.params.albumId).populate('owner', 'name email')
    if (!album) return res.status(404).json({ message: 'Álbum não encontrado' })
    if (!album.isPublic && (!req.user || !album.owner._id.equals(req.user._id))) {
      return res.status(403).json({ message: 'Álbum privado' })
    }
    const photos = await Photo.find({ album: album._id })
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
    res.json({ album, photos })
  } catch (error) {
    res.status(500).json({ message: 'Erro ao carregar álbum', error: error.message })
  }
})

export default router
