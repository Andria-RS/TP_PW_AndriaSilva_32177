import express from 'express'
import fs from 'fs'
import path from 'path'
import multer from 'multer'
import Album from '../models/Album.js'
import Photo from '../models/Photo.js'
import Comment from '../models/Comment.js'
import Like from '../models/Like.js'
import { authenticate, optionalAuthenticate } from '../middleware/auth.js'

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

const deleteLocalUpload = (fileUrl) => {
  if (!fileUrl || !fileUrl.startsWith('/uploads/')) return

  const filePath = path.resolve(process.cwd(), fileUrl.replace(/^\//, ''))
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath)
  }
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

router.post('/', authenticate, upload.single('coverImage'), async (req, res) => {
  try {
    const { name, description, theme, isPublic } = req.body
    const coverImageUrl = req.file ? `/uploads/${req.file.filename}` : req.body.coverImageUrl

    if (!name || !theme) {
      return res.status(400).json({ message: 'Nome e tema são obrigatórios' })
    }

    const album = await Album.create({
      name,
      description,
      theme,
      coverImageUrl,
      isPublic: isPublic !== 'false' && isPublic !== false,
      owner: req.user._id
    })

    res.status(201).json(album)
  } catch (error) {
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
      deleteLocalUpload(album.coverImageUrl)
      album.coverImageUrl = `/uploads/${req.file.filename}`
    } else if (typeof coverImageUrl !== 'undefined') {
      if (coverImageUrl !== album.coverImageUrl) {
        deleteLocalUpload(album.coverImageUrl)
      }
      album.coverImageUrl = coverImageUrl
    }

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

    if (!album) {
      return res.status(404).json({ message: 'Álbum não encontrado' })
    }

    if (!album.owner.equals(req.user._id)) {
      return res.status(403).json({ message: 'Não tem permissão' })
    }

    const photos = await Photo.find({ album: album._id }).select('_id imageUrl')
    const photoIds = photos.map((photo) => photo._id)

    if (photoIds.length > 0) {
      await Comment.deleteMany({ photo: { $in: photoIds } })
      await Like.deleteMany({ photo: { $in: photoIds } })
      await Photo.deleteMany({ _id: { $in: photoIds } })

      for (const photo of photos) {
        deleteLocalUpload(photo.imageUrl)
      }
    }

    deleteLocalUpload(album.coverImageUrl)
    await album.deleteOne()

    res.json({
      message: 'Álbum, fotos e dados associados eliminados',
      deletedPhotos: photoIds.length
    })
  } catch (error) {
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
    res.status(500).json({ message: 'Erro ao carregar álbum', error: error.message })
  }
})

export default router