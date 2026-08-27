/**
 * Utility untuk memproses dan mengompresi gambar (Logo Sekolah, Foto Siswa)
 * agar ukuran ringkas (< 150KB) untuk penyimpanan efisien di Firestore dan localStorage.
 */

export interface ProcessImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  mimeType?: 'image/jpeg' | 'image/png' | 'image/webp';
}

export const compressAndEncodeImage = (
  file: File,
  options: ProcessImageOptions = {}
): Promise<string> => {
  const {
    maxWidth = 400,
    maxHeight = 400,
    quality = 0.85,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Format file tidak valid. Silakan pilih berkas gambar (JPG, PNG, WebP).'));
      return;
    }

    // Batasan ukuran awal berkas (maksimal 10MB)
    if (file.size > 10 * 1024 * 1024) {
      reject(new Error('Ukuran berkas gambar terlalu besar (maksimal 10MB).'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        reject(new Error('Gagal membaca file gambar.'));
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Resize proportionally
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = Math.max(1, width);
          canvas.height = Math.max(1, height);
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }

          // Background white for transparent PNG converted to JPEG
          if (mimeType === 'image/jpeg') {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL(mimeType, quality);
          resolve(dataUrl);
        } catch (err) {
          // Fallback to original read if canvas fails
          resolve(result);
        }
      };

      img.onerror = () => {
        reject(new Error('Gagal merender gambar. Format file mungkin rusak.'));
      };

      img.src = result;
    };

    reader.onerror = () => {
      reject(new Error('Gagal membaca berkas gambar.'));
    };

    reader.readAsDataURL(file);
  });
};
