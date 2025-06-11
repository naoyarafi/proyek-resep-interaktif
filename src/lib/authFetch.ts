import { useAuthStore } from "@/store/authStore";

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const { accessToken, setAuthData, clearAuthData } = useAuthStore.getState();

  // 1. Buat objek Headers baru dari options yang ada (jika ada)
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  
  // 2. Tambahkan token otorisasi jika ada
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  
  // 3. Masukkan headers yang sudah diperbarui ke dalam options
  options.headers = headers;

  // Coba request pertama
  let response = await fetch(url, options);

  // Jika response adalah 401 (Unauthorized), kemungkinan token kedaluwarsa
  if (response.status === 401) {
    console.log("Access token kedaluwarsa, mencoba refresh...");
    try {
      // Panggil API refresh token
      const refreshResponse = await fetch('/api/auth/refresh', { method: 'POST' });
      const data = await refreshResponse.json();

      if (!refreshResponse.ok) {
        throw new Error('Sesi tidak valid.');
      }

      // Jika refresh berhasil, perbarui state Zustand dengan token baru
      const newAccessToken = data.accessToken;
      const { user } = useAuthStore.getState();
      if (user) {
        setAuthData({ user, accessToken: newAccessToken });
      }

      // Ulangi request yang gagal tadi dengan token baru
      console.log("Token berhasil di-refresh, mengulangi request awal...");
      // Perbarui header dengan token baru
      headers.set('Authorization', `Bearer ${newAccessToken}`);
      options.headers = headers;
      response = await fetch(url, options);

    } catch (error) {
      console.error("Gagal me-refresh token:", error);
      clearAuthData();
      window.location.href = '/login'; 
      return Promise.reject(error);
    }
  }

  return response;
}