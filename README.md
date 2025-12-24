# Quiz Up - Test O'yini

HTML va CSS haqida 40 ta savol bilan test o'yini. Vite bilan yaratilgan.

## Xususiyatlar

- ✅ 40 ta HTML va CSS savollari
- ✅ Talaba ismini kiritish
- ✅ Real-time progress tracking
- ✅ 60% dan oshsa "O'tdingiz" xabari
- ✅ Admin panel - barcha talabalar va ularning natijalarini ko'rish
- ✅ Statistikalar (jami talabalar, o'tganlar, o'tmaganlar, o'rtacha ball)
- ✅ LocalStorage bilan natijalarni saqlash
- ✅ Responsive dizayn

## O'rnatish

```bash
npm install
```

## Ishga tushirish

### Development mode:

1. **Backend serverni ishga tushirish** (birinchi terminal):
```bash
npm run dev:server
```

2. **Frontend serverni ishga tushirish** (ikkinchi terminal):
```bash
npm run dev
```

Yoki faqat backend:
```bash
npm run server
```

### Production build:
```bash
npm run build
npm run preview
```

**Eslatma**: Backend server `http://localhost:3001` da ishlaydi, frontend `http://localhost:3000` da.

## Foydalanish

### Talabalar uchun:
1. **Testni boshlash**: Bosh sahifada "Testni boshlash" tugmasini bosing
2. **Ma'lumotlarni kiriting**: Ismingiz va guruhni kiriting (masalan: "Ali", "101")
3. **Savollarga javob bering**: Har bir savolga javob bering
4. **Natijani ko'ring**: Test yakunlanganda natijangizni ko'ring

### Admin Panel:
1. **Admin link**: `http://localhost:3000/?admin=true` yoki `http://localhost:3000/?admin=true` linkini oching
2. **Barcha natijalarni ko'ring**: Talabalar ismi, guruhi, ball, foiz va holat ko'rinadi
3. **Statistikani ko'ring**: Jami talabalar, o'tganlar, o'tmaganlar va o'rtacha ball
4. **Natijalarni boshqarish**: Kerak bo'lsa, natijalarni o'chiring yoki barchasini tozalang

## Texnologiyalar

- Vite
- Vanilla JavaScript (ES6+)
- CSS3
- LocalStorage

