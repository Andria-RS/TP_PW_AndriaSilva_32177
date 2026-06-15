import mongoose from 'mongoose'

const photoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    theme: { type: String, required: true },
    description: { type: String },
    authorName: { type: String },
  },
  { timestamps: true }
)

export default mongoose.model('Photo', photoSchema)
