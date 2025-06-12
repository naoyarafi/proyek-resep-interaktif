"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import CommentIcon from "@mui/icons-material/Comment";
import { useRouter } from "next/navigation";

export const dynamic = 'force-dynamic';

// Definisikan tipe notifikasi agar sesuai dengan data dari API
interface INotification {
  _id: string;
  message: string;
  link: string;
  type: "reaction" | "comment" | "admin_action";
  createdAt: string;
}

export default function NotificationBell() {
  const { accessToken } = useAuthStore();
  const router = useRouter();

  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  // Fungsi untuk mengambil notifikasi
  const fetchNotifications = async () => {
    if (!accessToken) return;
    try {
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.data.notifications);
        setUnreadCount(data.data.unreadCount);
      }
    } catch (error) {
      console.error("Gagal mengambil notifikasi:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Set interval untuk fetch ulang notifikasi setiap 1 menit (opsional)
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, [accessToken]);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = async () => {
    setAnchorEl(null);
    // Jika ada notifikasi yang belum dibaca, panggil API untuk menandainya
    if (unreadCount > 0 && accessToken) {
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        // Reset count di UI menjadi 0 secara optimis
        setUnreadCount(0);
      } catch (error) {
        console.error("Gagal menandai notifikasi sebagai dibaca:", error);
      }
    }
  };

  const handleNotificationClick = (link: string) => {
    handleClose();
    router.push(link);
  };

  const getIcon = (type: string) => {
    if (type === "reaction")
      return <ThumbUpIcon fontSize="small" color="primary" />;
    if (type === "comment")
      return <CommentIcon fontSize="small" color="success" />;
    return <NotificationsIcon fontSize="small" />;
  };

  return (
    <div>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          <NotificationsIcon />
        </Badge>
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{ style: { maxHeight: 400, width: "800px" } }}
      >
        <Typography variant="h6" sx={{ px: 2, py: 1 }}>
          Notifikasi
        </Typography>
        <Divider />
        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <MenuItem
              key={notif._id}
              onClick={() => handleNotificationClick(notif.link)}
            >
              <ListItemIcon>{getIcon(notif.type)}</ListItemIcon>
              <ListItemText
                primaryTypographyProps={{ style: { whiteSpace: "normal" } }} // Memastikan teks utama bisa wrap
                secondaryTypographyProps={{ style: { whiteSpace: "normal" } }} // Memastikan teks kedua bisa wrap
                primary={notif.message}
                secondary={new Date(notif.createdAt).toLocaleString("id-ID")}
              />
            </MenuItem>
          ))
        ) : (
          <MenuItem disabled>Tidak ada notifikasi</MenuItem>
        )}
      </Menu>
    </div>
  );
}
