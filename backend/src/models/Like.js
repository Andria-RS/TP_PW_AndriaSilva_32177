import mongoose from 'mongoose'

const likeSchema = new mongoose.Schema(
  {
    photo: { type: mongoose.Schema.Types.ObjectId, ref: 'Photo', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
)

likeSchema.index({ photo: 1, user: 1 }, { unique: true })

export default mongoose.model('Like', likeSchema)
