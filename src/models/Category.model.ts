import mongoose, { Document, Schema } from 'mongoose';

export interface ICategory extends Document {
  _id: mongoose.Schema.Types.ObjectId;
  name: string;
}

const CategorySchema: Schema<ICategory> = new Schema({
    name: { type: String, required: true, unique: true },
});

const Category = mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);

export default Category;