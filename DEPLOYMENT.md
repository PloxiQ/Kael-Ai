# KAEL — деплой без Vercel

Схема:

```
Пользователь
   │
   ├── https://YOUR-SITE.infinityfreeapp.com   (статика Next.js из out/)
   │        │
   │        └── fetch NEXT_PUBLIC_KAEL_API_URL
   │
   └── https://YOUR-SERVICE.onrender.com       (FastAPI + uvicorn)
            ├── GET  /health
            └── POST /api/chat
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
```

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
| `frontend/.env.production.example` | шаблон публичного URL бэкенда |
| `frontend/scripts/check-production-env.mjs` | защита от сборки с localhost/LAN URL |
| `frontend/public/.htaccess` | маршрутизация, 404, кэш и сжатие для InfinityFree |
| `backend/main.py` | CORS через `KAEL_ALLOWED_ORIGINS` + локальные адреса |
| `backend/.env.example` | пример CORS-переменных |
| `backend/Procfile` | запуск для Koyeb/buildpack |
| `backend/Dockerfile` | запуск в Docker/Koyeb/HF Spaces |
| `backend/.python-version` | Python 3.11.9 |
| `render.yaml` | Blueprint для Render (rootDir: `backend`) |

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

> В текущей версии кода KAEL нет эндпоинтов Telegram-авторизации: ни фронтенд,
> ни `backend/main.py` не содержат проверки `initData`. CORS ниже уже подготовлен
> на случай, когда эта фича будет добавлена.

Если авторизация через Telegram-бота отправляет данные в заголовке
`Authorization` (рекомендуемый вариант), текущая CORS-конфигурация уже разрешает
этот заголовок. Если вы используете cookies, придётся:

1. поставить `allow_credentials=True` в `backend/main.py`;
2. использовать только точные origins (без `*`);
3. отправлять `credentials: "include"` на фронтенде.

Проверка `initData` от Telegram должна выполняться на бэкенде с использованием
токена бота; не храните токен бота в статическом фронтенде.

---

## 7. Чек-лист перед публикацией

- [ ] Бэкенд задеплоен, `/health` возвращает `{"status":"ok"}`.
- [ ] `KAEL_ALLOWED_ORIGINS` содержит точный HTTPS-адрес InfinityFree.
- [ ] `KAEL_DEV_SECRET` заменён на сильный секрет.
- [ ] `OPENROUTER_API_KEY` (и/или `GROQ_API_KEY`) задан в панели хостинга.
- [ ] `frontend/.env.production` содержит публичный URL бэкенда.
- [ ] `.env.local` / `.env.production.local` не перекрывают production-URL при сборке.
- [ ] `npm run build` завершился успешно, `out/index.html` существует.
- [ ] В `out/_next/static/chunks/app/*.js` нет `localhost`/`192.168.*`.
- [ ] Содержимое `out/` загружено в `htdocs`, `.htaccess` на месте.
- [ ] HTTPS включён, сайт открывается по `https://`.
- [ ] Артефакты и превью работают на публичном домене.
