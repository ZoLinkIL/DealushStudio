# סטודיו דילוש: הקמה (פעם אחת, כ-20 דקות)

מערכת פרטית. רק המייל שמוגדר ב-`ALLOWED_EMAIL` יכול להיכנס, וכל השאר נחסם גם בכניסה עם Google וגם בכל בקשה.

## 1. בוט טלגרם אישי (3 דקות)
בוט חדש ונפרד מ-@DealushBot, שמדבר רק איתך.

1. בטלגרם, פתח את **@BotFather** ושלח `/newbot`.
2. שם: `העוזר של אורי` (או כל שם). שם משתמש: למשל `ori_studio_bot`.
3. העתק את הטוקן שהוא נותן. זה `TELEGRAM_BOT_TOKEN`.
4. פתח את הבוט החדש ולחץ **Start**.
5. ה-Chat ID שלך: פתח את **@userinfobot** ולחץ Start. המספר שמופיע ב-Id הוא `TELEGRAM_CHAT_ID`.

## 2. Google Cloud: כניסה עם Google (7 דקות)
1. https://console.cloud.google.com, ופרויקט חדש בשם `dealush-studio`.
2. **APIs & Services → OAuth consent screen**: External, שם האפליקציה "סטודיו דילוש", המייל שלך. ב-**Audience** לחץ **Publish app**. (אפשר להשאיר במצב Testing ולהוסיף את המייל שלך כ-Test user, אבל אז הכניסה פגה כל 7 ימים.)
3. **Credentials → Create credentials → OAuth client ID** → Web application.
4. **Authorized redirect URIs**, הוסף את שתי הכתובות:
   - `https://studio.dealush.co.il/api/auth/callback/google`
   - `https://<שם-הפרויקט>.vercel.app/api/auth/callback/google`
5. העתק את **Client ID** ואת **Client secret**.

## 3. Vercel: פרויקט חדש (5 דקות)
1. **Add New → Project →** בחר את הריפו `ZoLinkIL/DealushStudio` → Deploy. הבנייה הראשונה תעבוד, אבל עוד לא תהיה כניסה.
2. בפרויקט: **Storage → Create → Neon (Postgres)** → Connect. זה מוסיף `DATABASE_URL` לבד.
3. **Storage → Create → Blob** → Connect. זה מוסיף `BLOB_READ_WRITE_TOKEN` לבד.
4. **Settings → Environment Variables**, הוסף:

| שם | ערך |
|---|---|
| `ALLOWED_EMAIL` | `ori.gabbay28@gmail.com` |
| `AUTH_SECRET` | מחרוזת אקראית ארוכה (ראו למטה) |
| `AUTH_GOOGLE_ID` | ה-Client ID משלב 2 |
| `AUTH_GOOGLE_SECRET` | ה-Client secret משלב 2 |
| `STUDIO_URL` | `https://studio.dealush.co.il` |
| `TELEGRAM_BOT_TOKEN` | משלב 1 |
| `TELEGRAM_CHAT_ID` | משלב 1 |
| `TELEGRAM_WEBHOOK_SECRET` | מחרוזת אקראית (אותיות ומספרים בלבד) |
| `CRON_SECRET` | מחרוזת אקראית |
| `STUDIO_API_KEY` | מחרוזת אקראית, 32 תווים ומעלה |

**מחרוזת אקראית:** https://generate-secret.vercel.app/32 (רענון = מחרוזת חדשה). תשתמש במחרוזת אחרת לכל שדה.

5. **Deployments → ⋯ → Redeploy**.

## 4. דומיין studio.dealush.co.il (3 דקות)
1. ב-Vercel: **Settings → Domains → Add** → `studio.dealush.co.il`.
2. ב-MyNames, ב-DNS של dealush.co.il, הוסף רשומה:
   - סוג: `CNAME`
   - שם (Host): `studio`
   - ערך: הערך ש-Vercel מציג (בדרך כלל `cname.vercel-dns.com`)
3. אחרי כמה דקות Vercel יציג ✓ ותעודת SSL תונפק לבד.

## 5. בדיקה
1. היכנס ל-https://studio.dealush.co.il עם Google.
2. **הגדרות**: כל השורות צריכות להיות ירוקות.
3. **הגדרות → שלח הודעת בדיקה**. אמורה להגיע הודעה בבוט.
4. **הגדרות → חבר פקודות לבוט**. שלח לבוט `/today`.
5. בטלפון, התקנה למסך הבית: באייפון, בספארי: שיתוף ← "הוסף למסך הבית". באנדרואיד, בכרום: ⋮ ← "התקן אפליקציה".

## 6. עדכונים בטלגרם מ-GitHub (2 דקות)
כדי לקבל הודעה בכל פעם שאני מעדכן את הסטודיו, וכדי שתוכן שאני מכין יעלה ללוח:
GitHub → הריפו → **Settings → Secrets and variables → Actions → New repository secret**:

| שם | ערך |
|---|---|
| `TELEGRAM_BOT_TOKEN` | כמו ב-Vercel |
| `TELEGRAM_CHAT_ID` | כמו ב-Vercel |
| `STUDIO_URL` | `https://studio.dealush.co.il` |
| `STUDIO_API_KEY` | כמו ב-Vercel |

## מה נשלח לטלגרם
- **כל בוקר** (בערך 07:00 בחורף, 08:00 בקיץ): מה עולה היום, מה נשאר מהימים הקודמים, וחגים קרובים. ב-Vercel Hobby השעה יכולה לזוז עד שעה.
- **פריט חדש מוכן**: בכל פעם שאני מעלה תוכן ללוח.
- **עדכון גרסה**: בכל פעם שהקוד של הסטודיו מתעדכן.
- **פקודות**: `/today`, `/tomorrow`, `/week`. הבוט עונה רק ל-Chat ID שלך.

## תוכן שמגיע מ-Claude
שתי דרכים, ושתיהן יוצרות פריט בסטטוס "מוכן" ושולחות הודעה בטלגרם:
1. **API**: `POST /api/items` עם `Authorization: Bearer <STUDIO_API_KEY>`. הפורמט מופיע במסך ההגדרות.
2. **תיקיית inbox בריפו**: קובץ JSON (ותמונות) ב-`inbox/`. ‏GitHub Action שולח אותם ללוח ומוחק אותם מהריפו. ככה אני עובד מהסשנים שלי, כי אין לי גישה ישירה לאינטרנט משם. הפורמט ב-`inbox/README.md`.

## לוח חופשות בתי הספר
החגים מחושבים אוטומטית לכל שנה. חופשות בתי הספר (תשפ"ז) מופיעות ב-`lib/calendar.ts`, לפי לוח משרד החינוך כפי שפורסם. כדאי לאמת מול הלוח הרשמי, ולעדכן פעם בשנה.
