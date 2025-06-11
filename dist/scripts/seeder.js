"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// src/scripts/seeder.ts
require("dotenv/config");
const mongoose_1 = __importStar(require("mongoose"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const dbConnect_1 = __importDefault(require("../lib/dbConnect"));
// --- DEFINISI SCHEMA (STRUKTUR DATA MONGOOSE) ---
const UserSchema = new mongoose_1.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false }, // 'select: false' agar password tidak terkirim di query biasa
    address: { type: String },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    dateOfBirth: { type: Date },
    profilePictureUrl: { type: String, default: null },
    isBlocked: { type: Boolean, default: false },
    refreshToken: { type: String, select: false },
}, { timestamps: true });
const CategorySchema = new mongoose_1.Schema({
    name: { type: String, required: true, unique: true },
});
const RecipeSchema = new mongoose_1.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    author: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Category', required: true },
    mainIngredientUnit: { type: String, required: true, trim: true },
    mainIngredients: [{ _id: false, name: { type: String, required: true }, defaultQuantity: { type: Number, required: true } }],
    complementaryIngredients: [{ _id: false, name: { type: String, required: true }, quantityPerUnit: { type: Number, required: true }, unit: { type: String, required: true } }],
}, { timestamps: true });
const ReactionSchema = new mongoose_1.Schema({
    recipe: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Recipe', required: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    type: { type: String, enum: ['love', 'like'], required: true },
}, { timestamps: true });
ReactionSchema.index({ recipe: 1, user: 1 }, { unique: true });
const CommentSchema = new mongoose_1.Schema({
    recipe: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Recipe', required: true },
    user: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
}, { timestamps: true });
const ReportSchema = new mongoose_1.Schema({
    recipe: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Recipe', required: true },
    reportingUser: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, default: 'Resep palsu atau menyesatkan' },
    status: { type: String, enum: ['pending', 'reviewed'], default: 'pending' },
}, { timestamps: true });
// --- MODEL ---
// Kita perlu cek apakah model sudah ada sebelum mendefinisikannya ulang
const User = mongoose_1.default.model('User', UserSchema);
const Category = mongoose_1.default.model('Category', CategorySchema);
const Recipe = mongoose_1.default.model('Recipe', RecipeSchema);
const Reaction = mongoose_1.default.model('Reaction', ReactionSchema);
const Comment = mongoose_1.default.model('Comment', CommentSchema);
const Report = mongoose_1.default.model('Report', ReportSchema);
// --- FUNGSI SEEDER ---
const seedDatabase = async () => {
    try {
        await (0, dbConnect_1.default)();
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
        const salt = await bcryptjs_1.default.genSalt(10);
        const usersData = [
            { name: 'Admin Utama', email: 'admin@resep.com', password: await bcryptjs_1.default.hash('password123', salt), role: 'admin', address: 'Kantor Pusat', dateOfBirth: new Date('1990-01-01') },
            { name: 'Budi Santoso', email: 'budi@resep.com', password: await bcryptjs_1.default.hash('password123', salt), role: 'user', address: 'Jl. Merdeka 17', dateOfBirth: new Date('1995-05-10') },
            { name: 'Citra Lestari', email: 'citra@resep.com', password: await bcryptjs_1.default.hash('password123', salt), role: 'user', address: 'Jl. Pahlawan 45', dateOfBirth: new Date('1998-08-20') },
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
        const recipesData = [
            { title: 'Ayam Kecap Pedas Manis', description: '1. Potong ayam...', imageUrl: 'https://asset-2.tstatic.net/bangka/foto/bank/images/20230211-Ayam-goreng-mentega.jpg', author: userBudi._id, category: makananUtamaCat._id, mainIngredientUnit: 'kg', mainIngredients: [{ name: 'Ayam', defaultQuantity: 1 }], complementaryIngredients: [{ name: 'Kecap Manis', quantityPerUnit: 3, unit: 'sachet' }, { name: 'Garam', quantityPerUnit: 1, unit: 'sdt' }, { name: 'Air', quantityPerUnit: 200, unit: 'ml' }] },
            { title: 'Tahu Goreng Crispy', description: '1. Potong tahu...', imageUrl: 'https://asset.kompas.com/crops/l4NugScakkpODgZXQXgld2_lnc0=/0x0:1000x667/1200x800/data/photo/2021/06/10/60c191379a00a.jpg', author: userCitra._id, category: camilanCat._id, mainIngredientUnit: 'buah', mainIngredients: [{ name: 'Tahu Putih Besar', defaultQuantity: 2 }], complementaryIngredients: [{ name: 'Tepung Terigu', quantityPerUnit: 5, unit: 'sdm' }, { name: 'Bawang Putih Bubuk', quantityPerUnit: 1, unit: 'sdt' }] },
            { title: 'Es Teh Manis', description: '1. Seduh teh...', imageUrl: 'https://d1vbn70lmn1nqe.cloudfront.net/prod/wp-content/uploads/2021/06/15093247/Ketahui-Fakta-Es-Teh-Manis.jpg', author: adminUser._id, category: minumanCat._id, mainIngredientUnit: 'kantong', mainIngredients: [{ name: 'Teh Celup', defaultQuantity: 1 }], complementaryIngredients: [{ name: 'Gula Pasir', quantityPerUnit: 2, unit: 'sdm' }] },
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
        await mongoose_1.default.connection.close();
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Gagal melakukan seeding:', error);
        await mongoose_1.default.connection.close();
        process.exit(1);
    }
};
// Jalankan fungsi
seedDatabase();
