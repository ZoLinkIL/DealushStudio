# סטודיו דילוש

מערכת **פרטית** לניהול התוכן של דילוש. היא לא חלק מ-dealush.co.il, ואין בה משתמשים נוספים.

- **שלב 1 (בנוי):** מסך "היום", לוח שבועי וחודשי עם גרירה, פריטי תוכן עם קבצים, תבניות שבועיות, חגים וחופשות, בוט טלגרם אישי, API לתוכן מ-Claude, PWA.
- **שלבים 2–5:** מחולל פוסט ממלון, מתכנן חופשה, כלים חוסכי זמן, ומחירים חיים. אלה ייבנו רק אחרי אישור.

הקמה: ראו [SETUP.md](SETUP.md).

## סטאק
Next.js 15 (App Router) · Tailwind 4 · Auth.js עם Google (מוגבל ל-`ALLOWED_EMAIL`) · Neon Postgres · Vercel Blob · Vercel Cron · Hebcal.

## מבנה
```
app/(app)/            מסכים מוגנים: היום, לוח, פריט, תבניות, הגדרות
app/api/items         API לתוכן מבחוץ (מפתח STUDIO_API_KEY)
app/api/cron/morning  התראת בוקר לטלגרם (Vercel Cron)
app/api/telegram      webhook של הבוט האישי (/today /tomorrow /week)
app/api/upload        העלאת קבצים ישירות ל-Blob
lib/                  db, תאריכים, חגים, טלגרם
inbox/                תוכן מוכן שנשלח ללוח דרך GitHub Action
```

אין מפתחות בקוד. הכול במשתני סביבה, ראו `.env.example`.
