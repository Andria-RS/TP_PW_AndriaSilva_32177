import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'

import authRoutes from './routes/auth.js'
import photosRoutes from './routes/photos.js'
import albumsRoutes from './routes/albums.js'
import commentsRoutes from './routes/comments.js'
import likesRoutes from './routes/likes.js'

const app = express()

const PORT = process.env.PORT || 4000
const MONGO_URI =
  process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tp_pw'

const CLIENT_URL =
  process.env.CLIENT_URL || 'http://localhost:5173'

app.use(
  cors({
    origin: CLIENT_URL
  })
)

app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/photos', photosRoutes)
app.use('/api/albums', albumsRoutes)
app.use('/api/comments', commentsRoutes)
app.use('/api/likes', likesRoutes)

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok'
  })
})

const startServer = async () => {
  try {
    await mongoose.connect(MONGO_URI)

    console.log('MongoDB conetado')

    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`)
    })
  } catch (error) {
    console.error('Conexão à base de dados falhou:', error)
    process.exit(1)
  }
}

startServer()