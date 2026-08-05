export const brand = {
  name: 'Ele Store',
  tagline: 'Cửa hàng đồ chơi trực tuyến hàng đầu Việt Nam',
  logoUrl:
    process.env.BRAND_LOGO_URL ||
    `${process.env.CLIENT_URL || 'http://localhost:5173'}/images/logo-hero.png`,
  colors: {
    primary: '#60a5fa',
    primaryDark: '#dc2626',
    sky: '#38bdf8',
    accentBlue: '#041675',
    accentGold: '#FCB833',
    text: '#1f2937',
    muted: '#6b7280',
    bg: '#f9fafb',
    border: '#e5e7eb',
  },
  font: 'Plus Jakarta Sans, Inter, Arial, sans-serif',
  contact: {
    address: 'Thành phố Hà Nội',
    phone: '096.146.2003',
    email: 'support@elestore.vn',
    hours: 'Thứ 2 - Thứ 7: 8:00 - 21:00 / Chủ nhật: 9:00 - 18:00',
    facebook: 'https://www.facebook.com/nhat.quang.596650',
    instagram: 'https://www.instagram.com/quungvoi/?hl=en',
    youtube: 'https://www.youtube.com/@TheReviewerrrrr',
  },
};
