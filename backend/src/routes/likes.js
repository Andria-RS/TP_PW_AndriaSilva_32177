import express from 'express'
import Like from '../models/Like.js'
import Photo from '../models/Photo.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.get('/photo/:photoId', authenticate, async (req, res) => {
  try {
    const totalLikes = await Like.countDocuments({ photo: req.params.photoId })
    const userLike = await Like.findOne({ photo: req.params.photoId, user: req.user._id })

    res.json({
      likes: totalLikes,
      likedByMe: Boolean(userLike)
    })
  } catch (error) {
    res.status(500).json({ message: 'Erro ao contar likes', error: error.message })
  }
})

router.post('/photo/:photoId', authenticate, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.photoId)
    if (!photo) return res.status(404).json({ message: 'Foto não encontrada' })

    const existingLike = await Like.findOne({ photo: photo._id, user: req.user._id })

    if (existingLike) {
      await Like.findByIdAndDelete(existingLike._id)
      const totalLikes = await Like.countDocuments({ photo: photo._id })

      return res.json({
        message: 'Like removido',
        likes: totalLikes,
        likedByMe: false
      })
    }

    await Like.create({ photo: photo._id, user: req.user._id })
    const totalLikes = await Like.countDocuments({ photo: photo._id })

    res.status(201).json({
      message: 'Like adicionado',
      likes: totalLikes,
      likedByMe: true
    })
  } catch (error) {
    res.status(500).json({ message: 'Erro ao dar like', error: error.message })
  }
})

router.delete('/photo/:photoId', authenticate, async (req, res) => {
  try {
    const result = await Like.findOneAndDelete({ photo: req.params.photoId, user: req.user._id })
    if (!result) return res.status(404).json({ message: 'Like não encontrado' })
    const totalLikes = await Like.countDocuments({ photo: req.params.photoId })

    res.json({
      message: 'Like removido',
      likes: totalLikes,
      likedByMe: false
    })
  } catch (error) {
    res.status(500).json({ message: 'Erro ao remover like', error: error.message })
  }
})

export default router