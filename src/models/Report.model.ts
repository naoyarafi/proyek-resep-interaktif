import mongoose, { Document, Schema } from 'mongoose';
import { IRecipe } from './Recipe.model';
import { IUser } from './User.model';

export interface IReport extends Document {
  _id: mongoose.Schema.Types.ObjectId;
  recipe: IRecipe['_id']; // Resep yang dilaporkan
  reportingUser: IUser['_id']; // Pengguna yang melapor
  reason?: string; // Alasan laporan (opsional)
  status: 'pending' | 'reviewed'; // Status laporan
}

const ReportSchema: Schema<IReport> = new Schema({
  recipe: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
  reportingUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String },
  status: {
    type: String,
    enum: ['pending', 'reviewed'],
    default: 'pending', // Setiap laporan baru statusnya 'pending'
  },
}, {
  timestamps: true
});

// Mencegah user yang sama melaporkan resep yang sama berkali-kali
ReportSchema.index({ recipe: 1, reportingUser: 1 }, { unique: true });

const Report = mongoose.models.Report || mongoose.model<IReport>('Report', ReportSchema);

export default Report;