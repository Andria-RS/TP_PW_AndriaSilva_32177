import express from 'express'
import Photo from '../models/Photo.js'

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const photos = await Photo.find().sort({ createdAt: -1 })
    res.json(photos)
  } catch (error) {
    res.status(500).json({ message: 'Erro ao carregar fotos', error: error.message })
  }
})

router.post('/', async (req, res) => {
  try {
    const { title, imageUrl, theme, description, authorName } = req.body
    if (!title || !imageUrl || !theme) {
      return res.status(400).json({ message: 'Title, imageUrl e theme são obrigatórios' })
    }

    const photo = await Photo.create({ title, imageUrl, theme, description, authorName })
    res.status(201).json(photo)
  } catch (error) {
    res.status(500).json({ message: 'Erro ao criar foto', error: error.message })
  }
})

export default router
