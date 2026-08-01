import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.js'
import photosRoutes from './routes/photos.js'
import albumsRoutes from './routes/albums.js'
import commentsRoutes from './routes/comments.js'
import likesRoutes from './routes/likes.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 4000
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tp_pw'

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }))
app.use(express.json())
app.use('/uploads', express.static('uploads'))

app.use('/api/auth', authRoutes)
app.use('/api/photos', photosRoutes)
app.use('/api/albums', albumsRoutes)
app.use('/api/comments', commentsRoutes)
app.use('/api/likes', likesRoutes)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

mongoose
  .connect(MONGO_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Backend running on http://localhost:${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Database connection failed:', error)
    process.exit(1)
  })
