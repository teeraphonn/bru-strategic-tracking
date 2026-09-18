/**
 * ============================================================================
 * ระบบติดตามและประเมินผลโครงการตามยุทธศาสตร์ (BRU Strategic Tracking System)
 * ไฟล์: frontend/src/utils/imageUrl.js
 * หน้าที่: ฟังก์ชันยูทิลิตี้สำหรับจัดการ URL รูปภาพและการบีบอัดรูปภาพฝั่ง Client
 *          - getImageUrl: แปลง Path รูปภาพให้อยู่ในรูป URL เต็มที่สามารถเข้าถึงได้
 *            (รองรับทั้ง Cloudinary, http, https, data:, และ Local Server /uploads/)
 *          - compressImage: บีบอัดขนาดไฟล์ภาพบนเบราว์เซอร์ก่อนส่งไปยังเซิร์ฟเวอร์
 *            (ลดขนาดเหลือ ~60KB - 150KB เพื่อความรวดเร็วและประหยัด Bandwidth)
 * ============================================================================
 */

/**
 * ฟังก์ชันแปลง Path รูปภาพเป็น Full Accessible URL
 * @param {string} path - ที่อยู่รูปภาพ (เช่น '/uploads/abc.jpg' หรือ Cloudinary URL)
 * @returns {string} URL รูปภาพที่เบราว์เซอร์สามารถดึงมาแสดงผลได้
 */
export const getImageUrl = (path) => {
  if (!path) return '';
  // กรณีเป็น Full URL อยู่แล้ว (เช่น Cloudinary หรือ Data URI) ให้ส่งกลับได้ทันที
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('data:') ||
    path.startsWith('blob:')
  ) {
    return path;
  }

  // ปรับ Windows Backslash '\' ให้เป็น Forward Slash '/'
  const cleanPath = String(path).replace(/\\/g, '/');
  const normalized = cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`;

  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    // ตัด '/api' ท้าย VITE_API_URL ออก เพื่อให้ได้ Backend Host Origin
    const backendOrigin = apiUrl.replace(/\/api\/?$/, '');
    return `${backendOrigin}${normalized}`;
  }

  // กรณี Production บนโดเมนจริง ให้ใช้ Relative Path
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return normalized;
  }

  // Default สำหรับการรันบนเครื่อง Localhost
  return `http://localhost:5000${normalized}`;
};

/**
 * ฟังก์ชันบีบอัดรูปภาพบนเบราว์เซอร์ก่อนทำการอัปโหลด (Client-Side Canvas Compression)
 * @param {File} file - ไฟล์ภาพต้นฉบับจาก Input File
 * @param {number} maxDim - ขนาดด้านยาวสูงสุด (พิกเซล) ค่าเริ่มต้น 1280px
 * @param {number} quality - คุณภาพของภาพ JPEG (0.1 - 1.0) ค่าเริ่มต้น 0.8
 * @returns {Promise<File>} ไฟล์รูปภาพ JPEG ที่ถูกบีบอัดแล้ว
 */
export const compressImage = (file, maxDim = 1280, quality = 0.8) => {
  return new Promise((resolve) => {
    if (!file || !file.type || !file.type.startsWith('image/')) {
      return resolve(file);
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target.result;
      img.onload = () => {
        let { width, height } = img;
        // คำนวณ Aspect Ratio เพื่อย่อขนาดให้ไม่เกิน maxDim
        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        // วาดภาพลงบน HTML5 Canvas เพื่อทำการ Compress
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // แปลง Canvas เป็น Blob และส่งออกเป็น File Object ใหม่
        canvas.toBlob(
          (blob) => {
            if (!blob) return resolve(file);
            const compressed = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, '.jpg'),
              { type: 'image/jpeg', lastModified: Date.now() }
            );
            resolve(compressed);
          },
          'image/jpeg',
          quality
        );
      };
      img.onerror = () => resolve(file);
    };
    reader.onerror = () => resolve(file);
  });
};

export default getImageUrl;
