import express from 'express'
import Comment from '../models/Comment.js'
import Photo from '../models/Photo.js'
import { authenticate } from '../middleware/auth.js'

const router = express.Router()

router.get('/photo/:photoId', async (req, res) => {
  try {
    const comments = await Comment.find({ photo: req.params.photoId })
      .populate('author', 'name')
      .sort({ createdAt: -1 })
    res.json(comments)
  } catch (error) {
    res.status(500).json({ message: 'Erro ao carregar comentários', error: error.message })
  }
})

router.post('/photo/:photoId', authenticate, async (req, res) => {
  try {
    const { text } = req.body
    const photo = await Photo.findById(req.params.photoId)
    if (!photo) return res.status(404).json({ message: 'Foto não encontrada' })
    if (!text) return res.status(400).json({ message: 'Texto do comentário é obrigatório' })

    const comment = await Comment.create({
      photo: photo._id,
      author: req.user._id,
      text
    })

    res.status(201).json(comment)
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar comentário', error: error.message })
  }
})

router.put('/:commentId', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId)
    if (!comment) return res.status(404).json({ message: 'Comentário não encontrado' })
    if (!comment.author.equals(req.user._id)) return res.status(403).json({ message: 'Não tem permissão' })

    const { text } = req.body
    if (!text) return res.status(400).json({ message: 'Texto do comentário é obrigatório' })
    comment.text = text
    await comment.save()

    res.json(comment)
  } catch (error) {
    res.status(500).json({ message: 'Erro ao atualizar comentário', error: error.message })
  }
})

router.delete('/:commentId', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId)
    if (!comment) return res.status(404).json({ message: 'Comentário não encontrado' })
    if (!comment.author.equals(req.user._id)) return res.status(403).json({ message: 'Não tem permissão' })

    await comment.deleteOne()
    res.json({ message: 'Comentário eliminado' })
  } catch (error) {
    res.status(500).json({ message: 'Erro ao eliminar comentário', error: error.message })
  }
})

export default router
