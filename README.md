# Hisobim — Shaxsiy moliya boshqaruvi

Bu loyiha HTML, CSS va vanilla JavaScript asosida yozilgan oddiy shaxsiy moliya boshqaruvi ilovasi.

Ishga tushirish:

1. VS Code oching va `index.html` faylni Live Server bilan ishga tushiring.
2. Brauzerda ilova yuklanadi.

Tekshirish va qoidalar:

- UZS va USD tranzaksiyalar alohida saqlanadi va hisoblanadi.
- Kursni `Sozlamalar` bo‘limida qo‘lda kiritish mumkin (`1 USD = X UZS`).
- Kurs kiritilmagan bo‘lsa, asosiy valyutada umumiy ekvivalent ko‘rsatilmaydi va foydalanuvchiga kurs kiritish taklif qilinadi.

Saqlash:

- Barcha maʼlumotlar `localStorage` da `hisobim_v1` nomli obyekt sifatida saqlanadi.
- Schema versiyasi: 1
- Agar localStorage ishlamasa yoki JSON buzilgan bo‘lsa, ilova null holatga qaytadi va crasht qilinmaydi.

Cheklovlar va xususiyatlar:

- Backend yoki build jarayoni yo‘q.
- Tashqi kutubxonalar yoki CDN ishlatilmaydi.
- Diagrammalar Canvas orqali chizilgan.

Qo‘lda tekshirish checklist:

- [ ] Demo maʼlumotlarni yuklab, tranzaksiyalar ko‘rsatilishini tekshiring.
- [ ] Tranzaksiya qo‘shish, tahrirlash va o‘chirish funksiyalarini sinab ko‘ring.
- [ ] Kursni o‘zgartirib, konvertatsiya ko‘rsatkichlarini tekshiring.
- [ ] JSON eksport va import funksiyalarini sinab ko‘ring.

Qanday ishladim va qolgan ishlar:

- Asosiy fayl tuzilmasi va design system yaratildi.
- Responsive layout, navigation va theme qo‘shildi.
- Storage, tranzaksiya CRUD va asosiy hisoblashlar implementatsiya qilindi.
- Diagrammalar va eksport/importning asosiy qismi yozildi.

Qolgan ishlar:

- Budjetlar va jamg‘armalar uchun to‘liq CRUD va progress logikasi. (BAJARILDI)
- Batafsil import validatsiyasi va zaxira takliflari. (BAJARILDI — asosiy validatsiya va replace/merge UX qo‘shildi)
- Dashboarddagi baʼzi hisobotlar va filtrlarning to‘liq ishlashi.

Qo‘shimcha o‘zgarishlar:

- Modal oynalar uchun `Escape` tugmasi bilan yopish qo‘shildi.
- Jamg‘armalarga qo‘shish (save) va budjet progress barlari ishlaydi.

Sinovlar:

1. `index.html` oching va `Budjetlar` hamda `Jamg‘armalar` bo‘limlarida yangi elementlar yarating.
2. Tranzaksiya qo‘shib, mos oy va valyutada budjetga ta'sirini tekshiring — progress bar yangilanadi.
3. `Eksport` -> `JSON eksport` bilan zaxira oling; `JSON import` orqali fayl tanlab, Replace (OK) bilan almashtiring.


