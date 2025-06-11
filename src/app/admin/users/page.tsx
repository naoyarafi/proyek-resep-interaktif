// src/app/admin/users/page.tsx

import UserActionButtons from '@/components/UserActionButtons';
import dbConnect from '@/lib/dbConnect';
import User from '@/models/User.model';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@mui/material';

// Fungsi untuk mengambil data langsung dari database
async function getUsers() {
  await dbConnect();
  const users = await User.find({}).sort({ createdAt: -1 });
  return users;
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>Daftar Pengguna</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Nama</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Aksi</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
  {users.map((user) => (
    <TableRow key={user.id}>
      <TableCell>{user.name}</TableCell>
      <TableCell>{user.email}</TableCell>
      <TableCell>{user.role}</TableCell>
      <TableCell>{user.isBlocked ? 'Diblokir' : 'Aktif'}</TableCell>
      <TableCell>
        {/* Ganti <button> dengan komponen baru */}
        <UserActionButtons user={JSON.parse(JSON.stringify(user))} />
      </TableCell>
    </TableRow>
  ))}
</TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}