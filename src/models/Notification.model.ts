import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User.model';

export interface INotification extends Document {
  _id: mongoose.Schema.Types.ObjectId;
  user: IUser['_id']; // User yang menerima notifikasi
  type: 'reaction' | 'comment' | 'admin_action'; // Jenis notifikasi
  message: string; // Pesan notifikasi, cth: "John Doe menyukai resep Anda"
  link: string; // Link tujuan saat notifikasi diklik, cth: /recipes/[id]
  isRead: boolean; // Status sudah dibaca atau belum
  sender?: IUser['_id']; // User yang menyebabkan notifikasi (opsional)
}

const NotificationSchema: Schema<INotification> = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['reaction', 'comment', 'admin_action'],
    required: true,
  },
  message: { type: String, required: true },
  link: { type: String, required: true },
  isRead: { type: Boolean, default: false },
  sender: { type: Schema.Types.ObjectId, ref: 'User' },
}, {
  timestamps: true
});

const Notification = mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);

export default Notification;