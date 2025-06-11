// src/scripts/seeder.ts
import 'dotenv/config';
import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import dbConnect from '../lib/dbConnect';
import User from '../models/User.model';

// --- DEFINISI INTERFACE (UNTUK TYPESCRIPT) ---
// Ini mendefinisikan "bentuk" dari dokumen kita

interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Dibuat optional karena tidak akan dikirim kembali ke client
  address?: string;
  role: 'user' | 'admin';
  dateOfBirth?: Date;
  profilePictureUrl?: string;
  isBlocked: boolean;
  refreshToken?: string;
}

interface ICategory extends Document {
  name: string;
}

interface IRecipe extends Document {
  title: string;
  description: string;
  imageUrl: string;
  author: IUser['_id'];
  category: ICategory['_id'];
  mainIngredientUnit: string;
  mainIngredients: { name: string; defaultQuantity: number }[];
  complementaryIngredients: { name: string; quantityPerUnit: number; unit: string }[];
}

interface IReaction extends Document {
    recipe: IRecipe['_id'];
    user: IUser['_id'];
    type: 'love' | 'like';
}

interface IComment extends Document {
    recipe: IRecipe['_id'];
    user: IUser['_id'];
    text: string;
}

interface IReport extends Document {
    recipe: IRecipe['_id'];
    reportingUser: IUser['_id'];
    reason: string;
    status: 'pending' | 'reviewed';
}


// --- DEFINISI SCHEMA (STRUKTUR DATA MONGOOSE) ---


const CategorySchema: Schema<ICategory> = new Schema({
    name: { type: String, required: true, unique: true },
});

const RecipeSchema: Schema<IRecipe> = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    mainIngredientUnit: { type: String, required: true, trim: true },
    mainIngredients: [{ _id: false, name: { type: String, required: true }, defaultQuantity: { type: Number, required: true } }],
    complementaryIngredients: [{ _id: false, name: { type: String, required: true }, quantityPerUnit: { type: Number, required: true }, unit: { type: String, required: true } }],
}, { timestamps: true });

const ReactionSchema: Schema<IReaction> = new Schema({
    recipe: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['love', 'like'], required: true },
}, { timestamps: true });
ReactionSchema.index({ recipe: 1, user: 1 }, { unique: true });

const CommentSchema: Schema<IComment> = new Schema({
    recipe: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
}, { timestamps: true });

const ReportSchema: Schema<IReport> = new Schema({
    recipe: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
    reportingUser: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, default: 'Resep palsu atau menyesatkan' },
    status: { type: String, enum: ['pending', 'reviewed'], default: 'pending' },
}, { timestamps: true });


// --- MODEL ---
// Kita perlu cek apakah model sudah ada sebelum mendefinisikannya ulang
const Category = mongoose.model<ICategory>('Category', CategorySchema);
const Recipe = mongoose.model<IRecipe>('Recipe', RecipeSchema);
const Reaction = mongoose.model<IReaction>('Reaction', ReactionSchema);
const Comment = mongoose.model<IComment>('Comment', CommentSchema);
const Report = mongoose.model<IReport>('Report', ReportSchema);

// --- FUNGSI SEEDER ---
const seedDatabase = async () => {
    try {
        await dbConnect(); 
        console.log('MongoDB Terhubung melalui dbConnect...');
        
        console.log('Menghapus data lama...');
        await Promise.all([
            User.deleteMany(),
            Category.deleteMany(),
            Recipe.deleteMany(),
            Reaction.deleteMany(),
            Comment.deleteMany(),
            Report.deleteMany(),
        ]);

        console.log('Membuat data baru...');
        const salt = await bcrypt.genSalt(10);
        
        const usersData: Partial<IUser>[] = [
            { name: 'Admin Utama', email: 'admin@resep.com', password: await bcrypt.hash('password123', salt), role: 'admin', address: 'Kantor Pusat', dateOfBirth: new Date('1990-01-01')},
            { name: 'Budi Santoso', email: 'budi@resep.com', password: await bcrypt.hash('password123', salt), role: 'user', address: 'Jl. Merdeka 17', dateOfBirth: new Date('1995-05-10')},
            { name: 'Citra Lestari', email: 'citra@resep.com', password: await bcrypt.hash('password123', salt), role: 'user', address: 'Jl. Pahlawan 45', dateOfBirth: new Date('1998-08-20')},
        ];
        const users = await User.insertMany(usersData);
        
        const adminUser = users[0];
        const userBudi = users[1];
        const userCitra = users[2];

        const categoriesData = [
            { name: 'Makanan Utama' }, { name: 'Camilan' }, { name: 'Minuman' }, { name: 'Dessert' }, { name: 'Sarapan' }
        ];
        const categories = await Category.insertMany(categoriesData);
        const makananUtamaCat = categories[0];
        const camilanCat = categories[1];
        const minumanCat = categories[2];

        const recipesData: Partial<IRecipe>[] = [
            { title: 'Ayam Kecap Pedas Manis', description: '1. Potong ayam...', imageUrl: 'https://asset-2.tstatic.net/bangka/foto/bank/images/20230211-Ayam-goreng-mentega.jpg', author: userBudi._id, category: makananUtamaCat._id, mainIngredientUnit: 'kg', mainIngredients: [{ name: 'Ayam', defaultQuantity: 1 }], complementaryIngredients: [{ name: 'Kecap Manis', quantityPerUnit: 3, unit: 'sachet' }, { name: 'Garam', quantityPerUnit: 1, unit: 'sdt' }, { name: 'Air', quantityPerUnit: 200, unit: 'ml' }]},
            { title: 'Tahu Goreng Crispy', description: '1. Potong tahu...', imageUrl: 'https://asset.kompas.com/crops/l4NugScakkpODgZXQXgld2_lnc0=/0x0:1000x667/1200x800/data/photo/2021/06/10/60c191379a00a.jpg', author: userCitra._id, category: camilanCat._id, mainIngredientUnit: 'buah', mainIngredients: [{ name: 'Tahu Putih Besar', defaultQuantity: 2 }], complementaryIngredients: [{ name: 'Tepung Terigu', quantityPerUnit: 5, unit: 'sdm' }, { name: 'Bawang Putih Bubuk', quantityPerUnit: 1, unit: 'sdt' }]},
            { title: 'Es Teh Manis', description: '1. Seduh teh...', imageUrl: 'https://d1vbn70lmn1nqe.cloudfront.net/prod/wp-content/uploads/2021/06/15093247/Ketahui-Fakta-Es-Teh-Manis.jpg', author: adminUser._id, category: minumanCat._id, mainIngredientUnit: 'kantong', mainIngredients: [{ name: 'Teh Celup', defaultQuantity: 1 }], complementaryIngredients: [{ name: 'Gula Pasir', quantityPerUnit: 2, unit: 'sdm' }]},
        ];
        const recipes = await Recipe.insertMany(recipesData);
        const resepAyam = recipes[0];
        const resepTahu = recipes[1];
        
        await Reaction.insertMany([
            { recipe: resepAyam._id, user: userCitra._id, type: 'love' },
            { recipe: resepTahu._id, user: userBudi._id, type: 'like' },
        ]);

        await Comment.insertMany([
            { recipe: resepAyam._id, user: userCitra._id, text: 'Resepnya mantap!' },
        ]);
        
        await Report.insertMany([
            { recipe: resepTahu._id, reportingUser: adminUser._id },
        ]);

        console.log('✅ Data berhasil di-seed!');
        await mongoose.connection.close();
        process.exit(0);
    } catch (error) {
        console.error('❌ Gagal melakukan seeding:', error);
        await mongoose.connection.close();
        process.exit(1);
    }
};

// Jalankan fungsi
seedDatabase();