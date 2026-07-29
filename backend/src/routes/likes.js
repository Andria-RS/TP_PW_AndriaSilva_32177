import express from 'express'
import Like from '../models/Like.js'
import Photo from '../models/Photo.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.get('/photo/:photoId', async (req, res) => {
  try {
    const totalLikes = await Like.countDocuments({ photo: req.params.photoId })
    res.json({ likes: totalLikes })
  } catch (error) {
    res.status(500).json({ message: 'Erro ao contar likes', error: error.message })
  }
})

router.post('/photo/:photoId', authenticate, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.photoId)
    if (!photo) return res.status(404).json({ message: 'Foto não encontrada' })

    const like = await Like.create({ photo: photo._id, user: req.user._id })
    res.status(201).json(like)
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Já deu like a esta foto' })
    }
    res.status(500).json({ message: 'Erro ao dar like', error: error.message })
  }
})

router.delete('/photo/:photoId', authenticate, async (req, res) => {
  try {
    const result = await Like.findOneAndDelete({ photo: req.params.photoId, user: req.user._id })
    if (!result) return res.status(404).json({ message: 'Like não encontrado' })
    res.json({ message: 'Like removido' })
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover like', error: error.message })
  }
})

export default router
