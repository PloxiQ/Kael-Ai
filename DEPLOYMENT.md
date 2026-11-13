# KAEL — деплой без Vercel

Схема:

```
Пользователь
   │
   ├── https://YOUR-SITE.infinityfreeapp.com   (статика Next.js из out/)
   │        ├── POST /auth/telegram-webapp      (initData из Telegram)
   │        └── POST /api/chat                  (Authorization: Bearer ...)
   │
   └── https://YOUR-SERVICE.onrender.com       (FastAPI + uvicorn)
            ├── GET  /health                   (публичный)
            ├── POST /auth/telegram-webapp     (проверка initData)
            └── POST /api/chat                 (только с токеном)
```

Фронтенд полностью статический: Next.js собирает HTML/CSS/JS в `frontend/out/`.
Бэкенд — обычный Python-процесс `uvicorn main:app`, которому нужен хостинг с Python.

---

## 1. Бэкенд на Render (рекомендуемый вариант)

### 1.1. Подготовьте репозиторий

Загрузите проект в GitHub. В корне репозитория уже лежит `render.yaml`, а в
`backend/` — `Procfile`, `Dockerfile` и `.python-version`.

Render Blueprint сам найдёт `render.yaml` в корне.

### 1.2. Создайте сервис

Вариант A — Blueprint:

1. Render Dashboard → **New +** → **Blueprint**.
2. Подключите GitHub-репозиторий KAEL.
3. Render прочитает `render.yaml` и создаст web service `kael-api`.
4. Заполните секреты, которые помечены `sync: false` (см. таблицу ниже).
5. Нажмите **Apply**.

Вариант B — вручную:

1. **New +** → **Web Service**.
2. Подключите репозиторий.
3. Укажите:
   - **Root Directory:** `backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install --upgrade pip && pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path:** `/health`
   - **Plan:** Free
4. Добавьте переменные окружения из таблицы.

### 1.3. Переменные окружения Render

| Переменная | Обязательна | Значение |
| --- | --- | --- |
| `PYTHON_VERSION` | да | `3.11.9` |
| `OPENROUTER_API_KEY` | да, если используете OpenRouter | ключ с openrouter.ai |
| `GROQ_API_KEY` | нет | ключ Groq, если нужен провайдер Groq |
| `TELEGRAM_BOT_TOKEN` | да | токен бота из @BotFather, только на бэкенде |
| `KAEL_JWT_SECRET` | да | длинный случайный секрет для сессионных токенов |
| `KAEL_ALLOWED_TG_IDS` | нет | ID пользователей через запятую для закрытой беты; пусто = все |
| `KAEL_DEV_SECRET` | да | длинный случайный секрет, не `kael-dev-2026` |
| `KAEL_ALLOWED_ORIGINS` | да | `https://YOUR-SITE.infinityfreeapp.com` |
| `OPENROUTER_HTTP_REFERER` | желательно | `https://YOUR-SITE.infinityfreeapp.com` |
| `OPENROUTER_APP_NAME` | нет | `KAEL` |
| `KAEL_ALLOWED_ORIGIN_REGEX` | нет | оставьте пустым, если хватает точного origin |

Важно:

- `KAEL_ALLOWED_ORIGINS` — это **точный origin**: схема + домен, без пути и без
  завершающего `/`. Несколько адресов разделяются запятой:
  `https://kael.infinityfreeapp.com,https://www.kael.infinityfreeapp.com`.
- Локальные `http://localhost:3000` и `http://127.0.0.1:3000` (а также порт
  3001) разрешены всегда, поэтому с тем же бэкендом можно тестировать локально.
- После изменения переменных Render перезапускает сервис автоматически. Если
  нет — **Manual Deploy → Restart service**.
- `TELEGRAM_BOT_TOKEN` и `KAEL_JWT_SECRET` — секреты. Не попадают в статический
  фронтенд и не коммитятся в репозиторий.
- `KAEL_JWT_SECRET` можно сгенерировать так:
  `python -c "import secrets; print(secrets.token_urlsafe(48))"`.
- `OLLAMA_BASE_URL` на облаке не заработает: Ollama должна быть запущена рядом с
  бэкендом. На бесплатном хостинге используйте OpenRouter или Groq.

### 1.4. Получите публичный URL

После деплоя Render покажет адрес вида:

```
https://kael-api-xxxx.onrender.com
```

Проверьте:

```powershell
curl.exe https://kael-api-xxxx.onrender.com/health
# {"status":"ok"}
```

Этот URL понадобится для `NEXT_PUBLIC_KAEL_API_URL`.

### 1.5. Особенности бесплатного Render

- Сервис засыпает после ~15 минут без запросов. Первый запрос после сна может
  занимать 30–60 секунд.
- Диск эфемерный: не храните на нём базу данных и загруженные файлы.
- Если нужен «прогрев», можно периодически дергать `/health` через UptimeRobot
  или cron-job.org. Не делайте интервал слишком частым.

---

## 2. Альтернатива: Koyeb

1. Создайте **App** → **GitHub** → выберите репозиторий.
2. **Work directory:** `backend`.
3. **Build command:** `pip install -r requirements.txt`.
4. **Run command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`.
5. **Port:** `8000`, protocol HTTP.
6. Добавьте те же переменные окружения, что и для Render.
7. Deploy.

Koyeb также умеет собирать `backend/Dockerfile`:

- **Builder:** Dockerfile
- **Dockerfile path:** `backend/Dockerfile`
- **Port:** `8000`

`Dockerfile` слушает `${PORT:-7860}`, поэтому подходит и для Hugging Face Spaces.

### Hugging Face Spaces (опционально)

1. Создайте Space с SDK **Docker**.
2. Загрузите содержимое `backend/` (или подключите репозиторий).
3. В `README.md` Space укажите `app_port: 7860` (если используете стандартный
   порт HF) либо задайте переменную `PORT`.
4. Секреты (`OPENROUTER_API_KEY`, `KAEL_ALLOWED_ORIGINS` и т.д.) добавьте в
   **Settings → Variables and secrets**.
5. Откройте публичный URL Space и проверьте `/health`.

---

## 3. Сборка статического фронтенда

### 3.1. Установите зависимости

Нужен Node.js 20+.

```powershell
cd frontend
npm ci
```

### 3.2. Пропишите URL бэкенда

Скопируйте пример:

```powershell
Copy-Item .env.production.example .env.production
```

Откройте `frontend/.env.production` и замените значение:

```dotenv
NEXT_PUBLIC_KAEL_API_URL=https://kael-api-xxxx.onrender.com
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username
```

`NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` — публичное имя бота без `@`. Оно нужно для
кнопки «Открыть в Telegram» на экране блокировки. Это не секрет.

Правила:

- Только публичный **HTTPS**-URL бэкенда.
- Без завершающего `/`.
- Не `localhost` и не LAN-адрес: значение вшивается в JS на этапе сборки.
- После изменения URL нужно пересобрать статику.

> Важно: в Next.js `.env.local` имеет приоритет выше `.env.production`.
> В проекте локальный адрес вынесен в `frontend/.env.development.local` — этот
> файл загружается только командой `next dev` и не влияет на production-сборку.
>
> Если вы сами создали `frontend/.env.local` с локальным URL, удалите его или
> переименуйте на время сборки:
>
> ```powershell
> Rename-Item .env.local .env.local.dev
> ```
>
> После сборки можно вернуть:
>
> ```powershell
> Rename-Item .env.local.dev .env.local
> ```
>
> Альтернатива — передать переменную прямо в процессе сборки, она имеет
> наивысший приоритет:
>
> ```powershell
> $env:NEXT_PUBLIC_KAEL_API_URL="https://kael-api-xxxx.onrender.com"
> npm run build
> ```

### 3.3. Соберите `out/`

```powershell
npm run build
```

Перед сборкой автоматически запускается `scripts/check-production-env.mjs`.
Он откажется собирать статику, если:

- URL пустой;
- URL ведёт на `localhost`, `127.0.0.1` или LAN-адрес (`192.168.*`, `10.*`,
  `172.16–31.*`);
- URL не использует HTTPS;
- остался placeholder вроде `YOUR-BACKEND`;
- в URL есть путь, query или hash.

Это защищает от случайной публикации сборки, которая ходит на локальный
бэкенд. Для локального предпросмотра статики можно явно разрешить локальный
URL:

```powershell
$env:KAEL_ALLOW_LOCAL_BUILD="1"
npm run build
```

Для production этот флаг использовать не нужно.

В `next.config.mjs` уже включены:

```js
output: "export",
trailingSlash: true,
images: { unoptimized: true },
```

Поэтому после сборки появится папка `frontend/out/`:

```
out/
├── .htaccess
├── 404.html
├── 404/
├── _next/
├── icon.svg
├── index.html
└── index.txt
```

`out/.htaccess` создаётся из `frontend/public/.htaccess` автоматически.

### 3.4. Проверьте сборку

```powershell
Test-Path out\index.html          # True
Test-Path out\.htaccess           # True
Select-String -Path out\_next\static\chunks\app\*.js -Pattern "onrender.com"
```

В выводе должен быть ваш бэкенд-URL. Если видите `localhost` или `192.168.*`,
значит `.env.local` (или `.env.production.local`) перекрыл production-переменную —
пересоберите.

Локальный предпросмотр статики:

```powershell
npm run preview
# http://localhost:3000
```

`npm run preview` использует `npx serve out`. Это только локальная проверка;
на InfinityFree Node.js не нужен.

---

## 4. Загрузка на InfinityFree

### 4.1. Подготовьте сайт

1. Зарегистрируйтесь на infinityfree.com.
2. Создайте аккаунт и добавьте домен/поддомен.
3. Дождитесь активации (обычно несколько минут).
4. Запомните адрес вида `https://YOUR-SITE.infinityfreeapp.com` — он должен
   совпадать с `KAEL_ALLOWED_ORIGINS` на бэкенде.

### 4.2. Загрузите файлы

Через **Online File Manager**:

1. Control Panel → **Online File Manager**.
2. Откройте `htdocs`.
3. Удалите стандартные `index2.html` / `default.php`, если они есть.
4. Загрузите **содержимое** папки `out/` в `htdocs`, а не саму папку `out`.
   В `htdocs` должны оказаться `index.html`, `_next/`, `404.html`, `icon.svg`,
   `index.txt` и `.htaccess`.

Через FTP (надёжнее для скрытых файлов):

1. Control Panel → **FTP Accounts** → скопируйте host, username, password.
2. Подключитесь FileZilla к `ftp.infinityfree.com` (или host из панели).
3. Включите показ скрытых файлов: **Server → Force showing hidden files**.
4. Загрузите содержимое `out/` в `htdocs`.
5. Убедитесь, что `.htaccess` лежит именно в `htdocs/.htaccess`.

Если File Manager не показывает `.htaccess`, загрузите его через FTP или
создайте файл вручную и вставьте содержимое `frontend/public/.htaccess`.

### 4.3. Включите HTTPS

1. Control Panel → **SSL Certificates** → выпустите бесплатный сертификат для
   вашего домена.
2. Дождитесь статуса Active.
3. Включите **Force HTTPS** в панели InfinityFree либо раскомментируйте блок
   HTTPS-редиректа в `htdocs/.htaccess`:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} !=on
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</IfModule>
```

### 4.4. Проверьте сайт

1. Откройте `https://YOUR-SITE.infinityfreeapp.com`.
2. В DevTools → Network проверьте запросы к `https://...onrender.com/health`.
3. В консоли не должно быть CORS-ошибок.
4. Откройте артефакт (HTML/React/SVG/Markdown) и проверьте превью.

Если сайт открывается, но API пишет «офлайн»:

- проверьте `https://...onrender.com/health` напрямую;
- проверьте `KAEL_ALLOWED_ORIGINS` — там должен быть точный адрес сайта;
- перезапустите backend после изменения env;
- убедитесь, что сайт открыт по `https`, а не `http`.

---

## 5. Что уже изменено в проекте

| Файл | Назначение |
| --- | --- |
| `frontend/next.config.mjs` | `output: "export"`, `trailingSlash`, `images.unoptimized` |
| `frontend/package.json` | `npm run build` собирает статику, `npm run preview` — локальный просмотр `out/` |
| `frontend/.env.production.example` | шаблон публичного URL бэкенда и username Telegram-бота |
| `frontend/scripts/check-production-env.mjs` | защита от сборки с localhost/LAN URL, предупреждение о пустом username бота |
| `frontend/public/.htaccess` | маршрутизация, 404, кэш и сжатие для InfinityFree |
| `frontend/components/TelegramAuthProvider.tsx` | вход по `initData`, хранение сессии, экран блокировки |
| `frontend/components/KaelMascot.tsx` | маскот Spark на экране входа и в туре |
| `frontend/components/KaelTour.tsx` | локализованный онбординг-тур по интерфейсу |
| `frontend/components/UserChip.tsx` | аватар и имя пользователя Telegram в шапке |
| `frontend/lib/api.ts` | `authFetch`, Bearer-токен, сброс сессии при 401 |
| `frontend/types/telegram.d.ts` | типы Telegram WebApp |
| `frontend/app/kael-auth.css` | стили экрана входа, маскота и тура |
| `backend/main.py` | CORS через `KAEL_ALLOWED_ORIGINS` + локальные адреса |
| `backend/auth.py` | проверка `initData`, сессионный токен, allowlist, `get_current_user` |
| `backend/.env.example` | пример CORS-переменных и Telegram-секретов |
| `backend/Procfile` | запуск для Koyeb/buildpack |
| `backend/Dockerfile` | запуск в Docker/Koyeb/HF Spaces |
| `backend/.python-version` | Python 3.11.9 |
| `render.yaml` | Blueprint для Render (rootDir: `backend`, Telegram-секреты) |

---

## 6. Ограничения статического экспорта

Текущий фронтенд совместим со статикой: единственный маршрут `/`, данные
загружаются с бэкенда через `fetch`, состояние живёт на клиенте.
При доработках помните, что `output: "export"` не поддерживает:

- API routes (`app/api/*`);
- `middleware.ts`;
- Server Actions;
- `cookies()`, `headers()`, `revalidate`, `dynamic = "force-dynamic"`;
- динамические маршруты без `generateStaticParams`;
- серверный `next/image` (поэтому включён `unoptimized`).

Если появится серверная логика, её нужно выносить в FastAPI, а не в Next.js.

### Telegram-авторизация

KAEL работает как Telegram Mini App. Отдельной базы пользователей нет: личность
подтверждает сам Telegram, а сессия живёт в подписанном токене.

Как это устроено:

1. Пользователь открывает бота и получает кнопку «Открыть KAEL» (бот отвечает
   на `/start`), либо сразу нажимает кнопку меню в чате.
2. Фронтенд берёт `window.Telegram.WebApp.initData` и отправляет его на
   `POST /auth/telegram-webapp`.
3. Бэкенд проверяет подпись `initData` токеном бота (`TELEGRAM_BOT_TOKEN`),
   проверяет свежесть `auth_date` (не старше 24 часов) и при необходимости
   сверяет ID с `KAEL_ALLOWED_TG_IDS`.
4. Бэкенд возвращает временный токен на 7 дней, подписанный `KAEL_JWT_SECRET`.
   Токен хранится в `localStorage` и отправляется в заголовке
   `Authorization: Bearer ...`.
5. `/api/chat` требует этот токен. `/health` остаётся публичным.

Если открыть сайт в обычном браузере, `initData` нет, поэтому показывается экран
«Доступ только через Telegram Mini App». Это ожидаемое поведение, а не ошибка:
вход возможен только внутри Telegram, где клиент сам подписывает данные
пользователя. Регистрация в чате с ботом не нужна — бот только выдаёт кнопку
запуска Mini App.

#### Webhook бота

Эндпоинт `POST /telegram/webhook` отвечает на `/start` и другие сообщения в
личке кнопкой «Открыть KAEL». Он проверяет заголовок
`X-Telegram-Bot-Api-Secret-Token`, поэтому `TELEGRAM_WEBHOOK_SECRET` должен
совпадать с `secret_token` при регистрации webhook.

Зарегистрируйте webhook один раз после деплоя:

```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://kael-api.onrender.com/telegram/webhook",
    "secret_token": "<TELEGRAM_WEBHOOK_SECRET>",
    "allowed_updates": ["message"]
  }'
```

Проверить статус: `getWebhookInfo`. Если webhook не нужен, его можно удалить
через `deleteWebhook`.

#### Настройка бота в @BotFather

1. Создайте бота (`/newbot`) или используйте существующего.
2. Скопируйте токен вида `123456789:AA...` — это `TELEGRAM_BOT_TOKEN`. Токен
   хранится только на бэкенде и никогда не попадает в статический фронтенд.
3. Задайте публичный URL сайта: **Bot Settings → Menu Button → Edit menu button
   URL** → `https://kael-ai.ct.ws`. Кнопка меню открывает KAEL как Mini App.
4. Username бота (без `@`) пропишите во фронтенде как
   `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME` — он нужен для кнопки «Открыть в
   Telegram» на экране блокировки.

Telegram открывает Mini App только по HTTPS, поэтому домен должен быть уже
доступен по `https://` до настройки кнопки меню.

#### Переменные

На Render (backend):

| Переменная | Обязательна | Назначение |
| --- | --- | --- |
| `TELEGRAM_BOT_TOKEN` | да | токен из @BotFather |
| `TELEGRAM_WEBHOOK_SECRET` | да | секрет заголовка `X-Telegram-Bot-Api-Secret-Token` |
| `KAEL_JWT_SECRET` | да | подпись сессионных токенов, длинная случайная строка |
| `KAEL_ALLOWED_TG_IDS` | нет | ID через запятую для закрытой беты; пусто = все |

Во фронтенде (`.env.production`, на этапе сборки):

```dotenv
NEXT_PUBLIC_TELEGRAM_BOT_USERNAME=your_bot_username
```

Важно: сначала задайте `TELEGRAM_BOT_TOKEN` и `KAEL_JWT_SECRET` на Render и
только потом деплойте код с защитой `/api/chat`. Если выложить код раньше,
вход через Telegram вернёт 500, а обычный браузер останется на экране
блокировки.

Сессионный токен — не стандартный JWT, а payload в base64url плюс HMAC-SHA256.
Он проверяется на каждом запросе; allowlist тоже перечитывается каждый раз,
поэтому удаление ID из `KAEL_ALLOWED_TG_IDS` отзывает доступ сразу, не дожидаясь
истечения 7 дней.

---

## 7. Чек-лист перед публикацией

- [ ] Бэкенд задеплоен, `/health` возвращает `{"status":"ok"}`.
- [ ] `KAEL_ALLOWED_ORIGINS` содержит точный HTTPS-адрес InfinityFree.
- [ ] `KAEL_DEV_SECRET` заменён на сильный секрет.
- [ ] `OPENROUTER_API_KEY` (и/или `GROQ_API_KEY`) задан в панели хостинга.
- [ ] `TELEGRAM_BOT_TOKEN` задан на Render.
- [ ] `TELEGRAM_WEBHOOK_SECRET` задан на Render и в `setWebhook`.
- [ ] `KAEL_JWT_SECRET` задан на Render (длинная случайная строка).
- [ ] При закрытой бете `KAEL_ALLOWED_TG_IDS` содержит нужные Telegram ID.
- [ ] `frontend/.env.production` содержит публичный URL бэкенда.
- [ ] `frontend/.env.production` содержит `NEXT_PUBLIC_TELEGRAM_BOT_USERNAME`.
- [ ] `.env.local` / `.env.production.local` не перекрывают production-URL при сборке.
- [ ] `npm run build` завершился успешно, `out/index.html` существует.
- [ ] В `out/_next/static/chunks/app/*.js` нет `localhost`/`192.168.*`.
- [ ] Содержимое `out/` загружено в `htdocs`, `.htaccess` на месте.
- [ ] HTTPS включён, сайт открывается по `https://`.
- [ ] Кнопка меню в @BotFather ведёт на `https://kael-ai.ct.ws`.
- [ ] Вход через Telegram открывает приложение, тур и чат работают.
- [ ] Обычный браузер показывает экран «Доступ только через Telegram Mini App».
- [ ] Артефакты и превью работают на публичном домене.
