import mongoose, { Document, Schema } from 'mongoose';
import { IRecipe } from './Recipe.model';
import { IUser } from './User.model';

// Definisikan tipe untuk dokumen Reaction
export interface IReaction extends Document {
  _id: mongoose.Schema.Types.ObjectId;
  recipe: IRecipe['_id']; // Referensi ke ID Resep
  user: IUser['_id'];   // Referensi ke ID User
  type: 'like' | 'love'; // Tipe reaksi hanya bisa 'like' atau 'love'
}

// Definisikan Skema Mongoose
const ReactionSchema: Schema<IReaction> = new Schema({
  recipe: { 
    type: Schema.Types.ObjectId, 
    ref: 'Recipe', // Memberitahu Mongoose untuk terhubung dengan model 'Recipe'
    required: true 
  },
  user: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', // Memberitahu Mongoose untuk terhubung dengan model 'User'
    required: true 
  },
  type: { 
    type: String, 
    enum: ['like', 'love'], // Memastikan nilainya hanya salah satu dari dua ini
    required: true 
  },
}, { 
  timestamps: true // Otomatis menambahkan createdAt dan updatedAt
});

// --- BAGIAN PALING PENTING ---
// Membuat Compound Index Unik
// Ini adalah aturan di level database yang menjamin bahwa
// kombinasi `recipe` dan `user` harus selalu unik.
// Dengan kata lain, satu user hanya bisa punya SATU baris data di koleksi ini untuk SATU resep.
ReactionSchema.index({ recipe: 1, user: 1 }, { unique: true });


const Reaction = mongoose.models.Reaction || mongoose.model<IReaction>('Reaction', ReactionSchema);

export default Reaction;