'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Box, Typography, TextField, Button, List, ListItem, ListItemAvatar, Avatar, ListItemText, Divider, CircularProgress, IconButton, ListItemSecondaryAction } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit'; // Impor ikon edit
import { authFetch } from '@/lib/authFetch';

export const dynamic = 'force-dynamic';

// ... (Interface IComment tetap sama) ...
interface IComment { _id: string; user: { _id: string; name: string; profilePictureUrl?: string; }; text: string; createdAt: string; }
interface CommentsSectionProps { recipeId: string; }


export default function CommentsSection({ recipeId }: CommentsSectionProps) {
  const { user, accessToken } = useAuthStore();
  const [comments, setComments] = useState<IComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ===== STATE BARU UNTUK MODE EDIT =====
  const [editingComment, setEditingComment] = useState<{ id: string, text: string } | null>(null);

  

  useEffect(() => {
    // ... (fetchComments tetap sama) ...
    const fetchComments = async () => {
      setIsLoading(true);
      try {
        const res = await authFetch(`/api/recipes/${recipeId}/comments`);
        const data = await res.json();
        if (data.success) setComments(data.data);
      } catch (error) { console.error("Gagal mengambil komentar:", error);
      } finally { setIsLoading(false); }
    };
    fetchComments();
  }, [recipeId]);

  const handleCommentSubmit = async (e: React.FormEvent) => {
    // ... (handleCommentSubmit tetap sama) ...
    e.preventDefault();
    if (!newComment.trim() || !accessToken) return;
    setIsSubmitting(true);
    try {
      const res = await authFetch(`/api/recipes/${recipeId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}`},
        body: JSON.stringify({ text: newComment }),
      });
      const data = await res.json();
      if (data.success) {
        setComments(prevComments => [data.data, ...prevComments]);
        setNewComment('');
      } else { throw new Error(data.message); }
    } catch (error) { console.error('Gagal mengirim komentar:', error);
    } finally { setIsSubmitting(false); }
  };

  const handleDeleteComment = async (commentId: string) => {
    // ... (handleDeleteComment tetap sama) ...
    if (!confirm('Apakah Anda yakin ingin menghapus komentar ini?')) return;
    setComments(prevComments => prevComments.filter(comment => comment._id !== commentId));
    try {
      await authFetch(`/api/comments/${commentId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${accessToken!}`}});
    } catch (error) { console.error(error); }
  };

  // ===== FUNGSI BARU UNTUK MENG-HANDLE EDIT =====
  const handleEditClick = (comment: IComment) => {
    setEditingComment({ id: comment._id, text: comment.text });
  };

  const handleUpdateComment = async () => {
    if (!editingComment || !accessToken) return;

    // Optimistic UI: perbarui state frontend dulu
    const originalComments = comments;
    setComments(prev => prev.map(c => 
      c._id === editingComment.id ? { ...c, text: editingComment.text } : c
    ));
    setEditingComment(null); // Keluar dari mode edit

    try {
      const res = await authFetch(`/api/comments/${editingComment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}`},
        body: JSON.stringify({ text: editingComment.text }),
      });
      if (!res.ok) throw new Error('Gagal update di server');
    } catch (error) {
      console.error(error);
      setComments(originalComments); // Rollback jika gagal
    }
  };


  // ... (Bagian return JSX) ...
  return (
    <Box sx={{ mt: 5 }}>
      <Typography variant="h5" gutterBottom>Komentar</Typography>

      {user && ( /* Form komentar */ <Box component="form" onSubmit={handleCommentSubmit} sx={{ mb: 3 }}>
          <TextField fullWidth multiline label="Tulis komentar..." value={newComment} onChange={(e) => setNewComment(e.target.value)} variant="outlined" />
          <Button type="submit" variant="contained" sx={{ mt: 1 }} disabled={isSubmitting}>{isSubmitting ? 'Mengirim...' : 'Kirim'}</Button>
        </Box>
      )}

      {isLoading ? ( <CircularProgress /> ) : (
        <List>
          {comments.map((comment, index) => (
            <div key={comment._id}>
              <ListItem alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar alt={comment.user.name} src={comment.user.profilePictureUrl || undefined} />
                </ListItemAvatar>

                {/* ===== LOGIKA KONDISIONAL BARU UNTUK TAMPILAN EDIT/NORMAL ===== */}
                {editingComment && editingComment.id === comment._id ? (
                  // --- TAMPILAN MODE EDIT ---
                  <Box sx={{ width: '100%' }}>
                    <TextField
                      fullWidth
                      multiline
                      variant="outlined"
                      value={editingComment.text}
                      onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })}
                    />
                    <Box sx={{ mt: 1 }}>
                      <Button size="small" onClick={handleUpdateComment}>Simpan</Button>
                      <Button size="small" color="secondary" onClick={() => setEditingComment(null)}>Batal</Button>
                    </Box>
                  </Box>
                ) : (
                  // --- TAMPILAN NORMAL ---
                  <>
                    <ListItemText
                      primary={comment.user.name}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">{comment.text}</Typography>
                          <br />{new Date(comment.createdAt).toLocaleString('id-ID')}
                        </>
                      }
                    />
                    {user && user.id === comment.user._id.toString() && (
                      <ListItemSecondaryAction>
                        <IconButton edge="end" aria-label="edit" onClick={() => handleEditClick(comment)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteComment(comment._id)}>
                          <DeleteIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    )}
                  </>
                )}
              </ListItem>
              {index < comments.length - 1 && <Divider variant="inset" component="li" />}
            </div>
          ))}
        </List>
      )}
    </Box>
  );
}