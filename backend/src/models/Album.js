import mongoose from 'mongoose'

const albumSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    theme: { type: String, required: true },
    isPublic: { type: Boolean, default: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
  },
  { timestamps: true }
)

export default mongoose.model('Album', albumSchema)
