import mongoose from 'mongoose'

const photoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    theme: { type: String },
    description: { type: String },
    album: { type: mongoose.Schema.Types.ObjectId, ref: 'Album' },
    isPublic: { type: Boolean, default: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
)

export default mongoose.model('Photo', photoSchema)
