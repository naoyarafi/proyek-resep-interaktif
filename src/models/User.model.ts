import mongoose, { Document, Schema } from 'mongoose';

// Interface untuk type safety
export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  address?: string;
  role: 'user' | 'admin';
  dateOfBirth?: Date;
  profilePictureUrl?: string;
  isBlocked: boolean;
  refreshToken?: string;
  isVerified: boolean; 
  verifyCode: string; 
  verifyCodeExpiry: Date; 
  passwordResetToken?: string; 
  passwordResetExpires?: Date; 
}

// Schema yang mendefinisikan struktur di MongoDB
const UserSchema: Schema<IUser> = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    address: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    dateOfBirth: { type: Date },
    profilePictureUrl: { type: String, default: null },
    isBlocked: { type: Boolean, default: false },
    refreshToken: { type: String, select: false },
    isVerified: { type: Boolean, default: false }, 
    verifyCode: { type: String }, 
    verifyCodeExpiry: { type: Date },
    passwordResetToken: { type: String }, 
    passwordResetExpires: { type: Date }, 
}, { timestamps: true });

// Membuat dan mengekspor model.
// Pola `mongoose.models.User || mongoose.model(...)` PENTING di sini.
// Ini mencegah model dikompilasi ulang setiap kali ada hot-reload di Next.js.
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;