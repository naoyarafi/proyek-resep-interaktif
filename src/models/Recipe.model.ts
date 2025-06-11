import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User.model';
import { ICategory } from './Category.model';

export interface IRecipe extends Document {
    title: string;
    description: string;
    imageUrl: string;
    author: IUser; 
    category: ICategory;
    mainIngredientUnit: string;
    mainIngredients: { name: string; defaultQuantity: number }[];
    complementaryIngredients: { name: string; quantityPerUnit: number; unit: string }[];
    isSuspended: boolean;
}

const RecipeSchema: Schema<IRecipe> = new Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    imageUrl: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    mainIngredientUnit: { type: String, required: true, trim: true },
    mainIngredients: [{ _id: false, name: { type: String, required: true }, defaultQuantity: { type: Number, required: true } }],
    complementaryIngredients: [{ _id: false, name: { type: String, required: true }, quantityPerUnit: { type: Number, required: true }, unit: { type: String, required: true } }],
    isSuspended: { type: Boolean, default: false }, 
}, { timestamps: true });

const Recipe = mongoose.models.Recipe || mongoose.model<IRecipe>('Recipe', RecipeSchema);

export default Recipe;