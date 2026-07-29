import mongoose from 'mongoose'

const commentSchema = new mongoose.Schema(
  {
    photo: { type: mongoose.Schema.Types.ObjectId, ref: 'Photo', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true }
  },
  { timestamps: true }
)

export default mongoose.model('Comment', commentSchema)
