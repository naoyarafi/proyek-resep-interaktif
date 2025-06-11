import mongoose, { Document, Schema } from 'mongoose';
import { IRecipe } from './Recipe.model';
import { IUser } from './User.model';

export interface IComment extends Document {
  _id: mongoose.Schema.Types.ObjectId;
  recipe: IRecipe['_id'];
  user: IUser['_id'];
  text: string;
}

const CommentSchema: Schema<IComment> = new Schema({
  recipe: { type: Schema.Types.ObjectId, ref: 'Recipe', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true },
}, {
  timestamps: true
});

const Comment = mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);

export default Comment;