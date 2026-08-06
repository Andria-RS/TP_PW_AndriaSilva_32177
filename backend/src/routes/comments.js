import express from 'express'
import Comment from '../models/Comment.js'
import { authenticate, optionalAuthenticate } from '../middleware/auth.js'

const router = express.Router()

router.get('/photo/:photoId', optionalAuthenticate, async (req, res) => {
  try {
    const comments = await Comment.find({ photo: req.params.photoId })
      .populate('author', 'name email')
      .sort({ createdAt: 1 })

    res.json(comments)
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao carregar comentários',
      error: error.message
    })
  }
})

router.post('/photo/:photoId', authenticate, async (req, res) => {
  try {
    const { text } = req.body

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: 'O comentário não pode estar vazio'
      })
    }

    const comment = await Comment.create({
      photo: req.params.photoId,
      author: req.user._id,
      text: text.trim()
    })

    await comment.populate('author', 'name email')

    res.status(201).json(comment)
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao criar comentário',
      error: error.message
    })
  }
})

router.put('/:commentId', authenticate, async (req, res) => {
  try {
    const { text } = req.body

    if (!text || !text.trim()) {
      return res.status(400).json({
        message: 'O comentário não pode estar vazio'
      })
    }

    const comment = await Comment.findById(req.params.commentId)

    if (!comment) {
      return res.status(404).json({
        message: 'Comentário não encontrado'
      })
    }

    if (!comment.author.equals(req.user._id)) {
      return res.status(403).json({
        message: 'Não tens permissão para editar este comentário'
      })
    }

    comment.text = text.trim()
    await comment.save()
    await comment.populate('author', 'name email')

    res.json(comment)
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao editar comentário',
      error: error.message
    })
  }
})

router.delete('/:commentId', authenticate, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId)

    if (!comment) {
      return res.status(404).json({
        message: 'Comentário não encontrado'
      })
    }

    if (!comment.author.equals(req.user._id)) {
      return res.status(403).json({
        message: 'Não tens permissão para apagar este comentário'
      })
    }

    await comment.deleteOne()

    res.json({
      message: 'Comentário apagado'
    })
  } catch (error) {
    res.status(500).json({
      message: 'Erro ao apagar comentário',
      error: error.message
    })
  }
})

export default router