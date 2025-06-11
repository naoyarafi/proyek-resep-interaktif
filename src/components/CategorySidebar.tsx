// src/components/CategorySidebar.tsx

import { List, ListItem, ListItemButton, ListItemText, Typography } from '@mui/material';
import Link from 'next/link';
import Category from '@/models/Category.model';
import dbConnect from '@/lib/dbConnect';

async function getCategories() {
  await dbConnect();
  const categories = await Category.find({}).sort({ name: 1 });
  // Mengubah objek Mongoose menjadi plain object
  return JSON.parse(JSON.stringify(categories));
}

export default async function CategorySidebar() {
  const categories = await getCategories();

  return (
    <div>
      <Typography variant="h6" gutterBottom>Kategori</Typography>
      <List>
        <ListItem disablePadding>
          <ListItemButton component={Link} href="/">
            <ListItemText primary="Semua Kategori" />
          </ListItemButton>
        </ListItem>
        {categories.map((category: any) => (
          <ListItem key={category._id} disablePadding>
            {/* Setiap link akan mengarah ke homepage dengan query parameter kategori */}
            <ListItemButton component={Link} href={`/?category=${category._id}`}>
              <ListItemText primary={category.name} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );
}