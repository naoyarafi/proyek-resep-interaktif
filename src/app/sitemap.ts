// src/app/sitemap.ts
import { MetadataRoute } from 'next';
import dbConnect from '@/lib/dbConnect';
import Recipe from '@/models/Recipe.model';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

  await dbConnect();
  const recipes = await Recipe.find({ isSuspended: { $ne: true } }).select('_id updatedAt').exec();

  const recipeUrls = recipes.map(recipe => ({
    url: `<span class="math-inline">\{baseUrl\}/recipes/</span>{recipe._id.toString()}`,
    lastModified: new Date(recipe.updatedAt).toISOString(),
  }));

  return [
    { url: baseUrl, lastModified: new Date().toISOString() },
    { url: `${baseUrl}/login`, lastModified: new Date().toISOString() },
    { url: `${baseUrl}/register`, lastModified: new Date().toISOString() },
    ...recipeUrls,
  ];
}