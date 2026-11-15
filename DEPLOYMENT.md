# KAEL — деплой без Vercel

Архитектура:

```
Браузер
  ├─ статический Next.js (InfinityFree)
  │    https://kael-ai.ct.ws
  │    ├─ Clerk JS (CDN)              вход, сессия, JWT-шаблон `kael`
  │    ├─ GET  /api/me                Authorization: Bearer <Clerk JWT>
  │    └─ POST /api/chat              Authorization: Bearer <Clerk JWT>
  │
  └─ FastAPI (Render)
       https://kael-api.onrender.com
       ├─ GET  /health                публичная проверка
       ├─ GET  /api/me                проверка подписи по JWKS
       └─ POST /api/chat              проверка подписи по JWKS
```

Frontend — полностью статический экспорт (`next build` → `frontend/out/`).
Backend — Python/FastAPI под `uvicorn`. Clerk работает только в браузере:
статический экспорт не поддерживает middleware и серверный `auth()`, поэтому
FastAPI сам проверяет RS256-подпись сессионного токена через JWKS и извлекает
роль.

> Не запускайте `clerk init` и не добавляйте `middleware.ts` или `app/api/*`:
> они несовместимы с `output: "export"`. Вся настройка Clerk выполняется вручную
> в Dashboard.

---

## 1. Clerk: настройка приложения

### 1.1. Создайте приложение

1. Откройте [dashboard.clerk.com](https://dashboard.clerk.com) → **Create application**.
2. Включите **Email + password**. OAuth-провайдеры можно добавить позже.
3. Скопируйте **Publishable key** (`pk_test_…` или `pk_live_…`).
4. Скопируйте **Frontend API URL** — он же `CLERK_ISSUER`, например
   `https://your-instance.clerk.accounts.dev`.

Publishable key публичный и попадает в JS-бандл. Secret key фронтенду и
бэкенду не нужен: подпись токена проверяется через публичный JWKS.

### 1.2. JWT-шаблон `kael`

Backend запрашивает токен строго с шаблоном `kael`:

```ts
getToken({ template: "kael" })
```

Создайте шаблон в **Sessions → JWT templates → New template → Blank**:

- **Name:** `kael` (обязательно точно такое имя);
- **Claims:**

```json
{
  "role": "{{user.public_metadata.role}}"
}
```

Стандартные claims (`sub`, `exp`, `iat`, `azp`) Clerk добавляет сам. Backend
требует их наличия, поэтому не удаляйте их и не заменяйте шаблон целиком на
собственный JSON без этих полей.

Если шаблон не создан, `getToken({ template: "kael" })` вернёт ошибку, а
`/api/me` и `/api/chat` ответят `401`.

### 1.3. Роли пользователей

Роль хранится в **public metadata** пользователя:

```json
{ "role": "admin" }
```

Допустимые значения:

| `public_metadata.role` | Доступ |
| --- | --- |
| `admin` | dev-режим, повышенные лимиты, остальные возможности администратора |
| `tester` | тариф Elite, бесплатный доступ |
| `user` или поле отсутствует | обычный бесплатный тариф |

Backend читает сначала claim `role`, затем `metadata.role` и
`public_metadata.role`. Неизвестное значение трактуется как `user`.

После изменения роли пользователь должен выйти и войти снова (или дождаться
обновления сессии), потому что старый токен ещё содержит прежние claims.

### 1.4. Разрешённые origin

В Clerk Dashboard добавьте адреса, с которых открывается приложение:

- `http://localhost:3000`
- `http://127.0.0.1:3000`
- `https://kael-ai.ct.ws`

Точное расположение раздела зависит от версии Dashboard: **Domains →
Allowed origins** либо **Settings → Restrictions**. Без этого Clerk может
отклонить запросы с продакшен-домена.

### 1.5. Production instance и DNS

Для beta можно остаться на development instance (`*.clerk.accounts.dev`).
Для production instance Clerk попросит привязать домен `kael-ai.ct.ws` и
добавит CNAME-записи (обычно `clerk`, `accounts`, `clkmail`) в DNS.

1. Откройте **Domains → Add domain**.
2. Скопируйте CNAME-записи, которые покажет Clerk.
3. Добавьте их у DNS-провайдера домена (панель InfinityFree или ваш регистратор).
4. Дождитесь статуса **Verified** и выпуска сертификата.

После переключения на production instance:

- publishable key станет `pk_live_…`;
- `CLERK_ISSUER` станет `https://clerk.kael-ai.ct.ws` (точное значение берите
  из Dashboard, раздел **API keys → Frontend API URL**);
- фронтенд нужно пересобрать, потому что publishable key встраивается на этапе
  сборки.

---

## 2. Backend на Render

### 2.1. Подготовка репозитория

Код backend лежит в `backend/`. В корне есть `render.yaml`, поэтому Render
может создать сервис через Blueprint.

### 2.2. Создание сервиса

Вариант A — Blueprint:

1. Render Dashboard → **New +** → **Blueprint**.
2. Выберите GitHub-репозиторий KAEL.
3. Render прочитает `render.yaml` и создаст web service `kael-api`.
4. Заполните обязательные переменные, помеченные `sync: false`: `CLERK_ISSUER`
   и ключи провайдеров, которые будете использовать.
5. Нажмите **Apply**.

Origin'ы, `KAEL_ENV`, `KAEL_SECRET_KEY`, `KAEL_PUBLIC_FRONTEND_URL` и
`KAEL_TRUST_PROXY_HEADERS` уже заданы в `render.yaml`. Если домен изменится,
обновите `KAEL_ALLOWED_ORIGINS`, `CLERK_AUTHORIZED_PARTIES` и
`KAEL_PUBLIC_FRONTEND_URL` в Dashboard.

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
4. Добавьте переменные окружения из таблицы ниже.

### 2.3. Переменные окружения Render

| Переменная | Обязательна | Значение |
| --- | --- | --- |
| `PYTHON_VERSION` | да | `3.11.9` |
| `KAEL_ENV` | да | `production` |
| `KAEL_SECRET_KEY` | да | случайная строка ≥32 символов; шифрует MCP-токены. На Render можно включить **Generate** |
| `KAEL_DATA_DIR` | нет | каталог SQLite и ключа; по умолчанию `backend/data` |
| `KAEL_TRUST_PROXY_HEADERS` | да | `1` — брать реальный IP из `X-Forwarded-For` и `CF-Connecting-IP` для rate limit |
| `KAEL_XFF_TRUSTED_ENTRIES` | нет | `1` — сколько правых записей `X-Forwarded-For` добавлено прокси; клиентский IP берётся левее |
| `KAEL_PUBLIC_API_URL` | рекомендуется | публичный HTTPS-URL backend без `/`; если пусто, используется `RENDER_EXTERNAL_URL` |
| `KAEL_PUBLIC_FRONTEND_URL` | да | `https://kael-ai.ct.ws` |
| `KAEL_MCP_REDIRECT_URI` | нет | переопределение OAuth redirect URI; обычно пусто |
| `KAEL_MCP_ALLOW_LOCAL` | нет | `0`; `KAEL_ENV=production` принудительно выключает localhost |
| `OPENROUTER_API_KEY` | да, если нужен OpenRouter | ключ с openrouter.ai |
| `GROQ_API_KEY` | нет | ключ Groq, если нужна модель по умолчанию на Groq |
| `ZEROCAT_API_KEY` | нет | ключ ZeroCat (`https://api.zero.cat/v1`) |
| `GEMINI_API_KEY` | нет | ключ Google Gemini (OpenAI-compatible endpoint) |
| `ZEROCAT_MODEL` | нет | модель ZeroCat по умолчанию; обычно `gpt-5.6-sol` |
| `GEMINI_MODEL` | нет | модель Gemini по умолчанию; обычно `gemini-3.6-flash` |
| `CLERK_ISSUER` | да | Frontend API URL из Clerk, без завершающего `/` |
| `CLERK_JWKS_URL` | нет | переопределение JWKS для прокси; обычно пусто |
| `CLERK_AUTHORIZED_PARTIES` | да | `https://kael-ai.ct.ws` |
| `KAEL_ALLOWED_ORIGINS` | да | `https://kael-ai.ct.ws` |
| `OPENROUTER_HTTP_REFERER` | рекомендуется | `https://kael-ai.ct.ws` |
| `OPENROUTER_APP_NAME` | нет | `KAEL` |
| `KAEL_ALLOWED_ORIGIN_REGEX` | нет | regex для дополнительных origin; обычно пусто |

Пояснения:

- `KAEL_ENV=production` убирает локальные origin'ы из CORS, включает HSTS и
  принудительно выключает `KAEL_MCP_ALLOW_LOCAL`. Без явного
  `KAEL_ALLOWED_ORIGINS` фронтенд получит CORS-ошибку.
- `KAEL_ALLOWED_ORIGINS` — точные origin'ы для CORS, со схемой и доменом, без
  завершающего `/`. Несколько значений — через запятую. Локальные
  `http://localhost:3000` и `http://127.0.0.1:3000` разрешены только вне
  production.
- `CLERK_AUTHORIZED_PARTIES` — значения claim `azp`, которые принимает backend.
  Если переменная пуста, используется `KAEL_ALLOWED_ORIGINS`. В production
  localhost-origin'ы не принимаются: без явного продакшен-домена все запросы
  получат `403 "Источник сессии не разрешён."`.
- `CLERK_JWKS_URL` нужен только при проксировании Clerk. В обычной схеме
  оставьте пустым: backend возьмёт `CLERK_ISSUER/.well-known/jwks.json`.
- `CLERK_SECRET_KEY` backend не использует. Не добавляйте его ни на фронтенд,
  ни в статический бандл.
- `KAEL_SECRET_KEY` шифрует bearer- и OAuth-токены MCP в SQLite. Если ключ
  изменится, старые токены перестанут расшифровываться и серверы придётся
  авторизовать заново. Задайте его до первого подключения MCP-сервера.
- OAuth callback MCP по умолчанию — `KAEL_PUBLIC_API_URL/api/mcp/oauth/callback`.
  Если `KAEL_PUBLIC_API_URL` не задан, используется `RENDER_EXTERNAL_URL`.
  Этот адрес должен быть доступен из браузера; при необходимости задайте
  `KAEL_MCP_REDIRECT_URI` и добавьте его в настройки OAuth-провайдера.
- `KAEL_PUBLIC_FRONTEND_URL` используется страницей успешного OAuth-callback
  для кнопки возврата в KAEL. Домен должен совпадать с фронтендом.
- SQLite MCP лежит на диске Render. На free-плане диск эфемерный: после
  redeploy подключения и токены пропадут. Для постоянного хранения нужен
  платный persistent disk и `KAEL_DATA_DIR` на нём.

Дополнительно можно настроить:

```env
OPENROUTER_MODEL=openai/gpt-4o-mini
GROQ_MODEL=openai/gpt-oss-120b
OLLAMA_MODEL=llama3
OLLAMA_BASE_URL=http://localhost:11434
GROQ_TIMEOUT_SECONDS=60
OPENROUTER_TIMEOUT_SECONDS=60
OLLAMA_TIMEOUT_SECONDS=120
KAEL_FAST_MAX_TOKENS=512
KAEL_BALANCED_MAX_TOKENS=1024
KAEL_DEEP_MAX_TOKENS=2048
KAEL_DEV_MAX_TOKENS=8192
KAEL_MAX_ATTACHMENTS=6
KAEL_MAX_ATTACHMENT_BASE64_CHARS=14000000
KAEL_MAX_PDF_CHARS=30000
KAEL_MAX_TEXT_ATTACHMENT_CHARS=60000
```

Ollama на бесплатном Render недоступна: локальный сервер не виден из облака.
В продакшене используйте OpenRouter или Groq.

### 2.4. Проверка backend

После деплоя:

```powershell
curl.exe https://kael-api-xxxx.onrender.com/health
# {"status":"ok"}
```

Запрос без токена должен вернуть `401`:

```powershell
curl.exe -i https://kael-api-xxxx.onrender.com/api/me
```

Полный адрес сохраните — он понадобится как `NEXT_PUBLIC_KAEL_API_URL`.

### 2.5. Особенности бесплатного Render

- Сервис засыпает после ~15 минут без запросов. Первый запрос после сна
  занимает 30–60 секунд.
- Диск непостоянный: SQLite MCP, OAuth-токены и `secret.key` теряются при
  redeploy. `KAEL_SECRET_KEY` вынесите в env (Blueprint делает это через
  `generateValue: true`); для сохранения самих подключений нужен платный
  persistent disk и `KAEL_DATA_DIR` на нём.
- Для прогрева можно пинговать `/health` через UptimeRobot или cron-job.org.
- После изменения переменных нужен **Manual Deploy → Restart service**:
  Render не перезапускает процесс автоматически.

---

## 3. Сборка статического фронтенда

### 3.1. Зависимости

```powershell
cd frontend
npm ci
```

### 3.2. Переменные production-сборки

Создайте `frontend/.env.production`:

```env
NEXT_PUBLIC_KAEL_API_URL=https://kael-api-xxxx.onrender.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxx
```

Правила:

- Оба значения встраиваются в бандл на этапе сборки. После изменения нужен
  повторный `npm run build`.
- `NEXT_PUBLIC_KAEL_API_URL` — HTTPS-адрес backend без завершающего `/`.
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` — publishable key, не secret key.
- `.env.local` имеет приоритет над `.env.production`. Если он существует,
  удалите или переименуйте его перед production-сборкой.
- `.env.development.local` действует только в `next dev`; на production-сборку
  он не влияет.

Если ключ Clerk пуст, сборка не падает, но приложение показывает экран
настройки вместо формы входа. Prebuild-скрипт выводит предупреждение.

### 3.3. Сборка

```powershell
npm run theme:light
npm run typecheck
npm run build
```

`theme:light` пересобирает `app/theme-light.css` по фактически используемым
классам. Запускайте его после добавления или изменения UI, иначе светлая тема
потеряет часть стилей.

Результат — каталог `frontend/out/`:

```
out/
  index.html
  404.html
  privacy/index.html
  terms/index.html
  security/index.html
  _next/static/...
  mascot/slime.js
  mascot/slime.css
  icon.svg
  .htaccess
```

`npm run build` использует `output: "export"` и `trailingSlash: true`, поэтому
каждая страница — каталог с `index.html`. `.htaccess` копируется из `public/`
автоматически.

### 3.4. Локальная проверка

```powershell
npm run preview
# http://localhost:3000
```

Проверьте:

1. Экран входа Clerk открывается.
2. Регистрация и вход по email/password работают.
3. После входа загружается чат, в шапке видна роль.
4. Сообщение отправляется, ответ приходит, маскот реагирует.
5. `GET /api/me` возвращает ожидаемую роль.
6. Выход возвращает на экран входа.
7. `/privacy/`, `/terms/`, `/security/` открываются без сессии и
   переключают RU/UK/EN.
8. В настройках → MCP-серверы добавленный сервер проходит `initialize`,
   показывает инструменты, а изменяющий вызов требует подтверждения в чате.

---

## 4. Загрузка на InfinityFree

### 4.1. Подготовка сайта

1. В панели InfinityFree откройте **Online File Manager** для `kael-ai.ct.ws`.
2. Перейдите в корень сайта (`htdocs`).
3. Удалите старые файлы предыдущей сборки, чтобы не остались устаревшие
   хэшированные чанки.

### 4.2. Загрузка

Загрузите **содержимое** `frontend/out/`, а не саму папку `out`:

```
htdocs/
  .htaccess
  index.html
  404.html
  _next/
  mascot/
  icon.svg
  privacy/
  terms/
  security/
```

Проще всего загрузить ZIP-архив содержимого `out/` и распаковать его в
`htdocs` через File Manager.

В архиве есть скрытый файл `.htaccess`. Включите показ скрытых файлов в File
Manager или загрузите его отдельно: без него не будет HSTS, CSP и остальных
заголовков безопасности.

Убедитесь, что `mascot/slime.js` и `mascot/slime.css` попали на сервер:
маскот загружается отдельными файлами из `public/mascot`.

Первый запрос InfinityFree отдаёт страницу JS-проверки (`/aes.js`), которая
ставит cookie и перезагружает страницу. Это ожидаемо: CSP разрешает встроенный
скрипт. Проверяйте сайт обычным браузером, а не `curl`.

### 4.3. HTTPS

В панели InfinityFree включите бесплатный SSL для домена и дождитесь выпуска
сертификата. Затем включите **Force HTTPS**. Backend разрешает только точный
origin `https://kael-ai.ct.ws`; `http://` и `www` нужно добавлять в
`KAEL_ALLOWED_ORIGINS` отдельно.

### 4.4. Проверка после загрузки

1. `https://kael-ai.ct.ws` открывается по HTTPS.
2. Нет ошибок CORS в консоли браузера.
3. Вход и выход работают.
4. `/api/me` возвращает `200` и роль.
5. `/api/chat` отвечает, маскот меняет эмоции.
6. `/privacy/`, `/terms/` и `/security/` доступны без входа, ссылки в футере
   лендинга и на экране входа ведут на них.
7. Заголовки `Content-Security-Policy`, `Strict-Transport-Security` и
   `X-Content-Type-Options` присутствуют в ответе (Network → Headers).
8. Обновите страницу с очисткой кэша (`Ctrl+F5`), если видите старый бандл.

---

## 5. Ограничения статического экспорта

- Нет Next.js middleware и серверного `auth()`. Авторизация на фронтенде —
  только клиентская проверка UI. Реальная защита — проверка JWT на FastAPI.
- Нет route handlers `app/api/*`. Все запросы идут напрямую на Render.
- Clerk работает как SPA: `ClerkProvider` монтируется в браузере, токен
  берётся через `useAuth().getToken({ template: "kael" })`.
- `dev_mode` в `/api/chat` разрешён только роли `admin`; клиентская кнопка
  dev-режима не является средством защиты.
- CORS настроен без credentials: авторизация идёт заголовком `Authorization`,
  cookie сессии не используются.
- Любое изменение `NEXT_PUBLIC_*` требует пересборки и повторной загрузки
  `out/`.

---

## 6. Диагностика

| Симптом | Причина | Решение |
| --- | --- | --- |
| Вместо входа экран «Clerk не настроен» | Пустой `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Заполните ключ и пересоберите фронтенд |
| `500 CLERK_ISSUER не настроен на сервере` | На Render нет `CLERK_ISSUER` | Добавьте переменную и перезапустите сервис |
| `401 Недействительный или просроченный токен` | Другой Clerk instance, неверный issuer, истёк токен | Сверьте `CLERK_ISSUER` с Dashboard; выйдите и войдите снова |
| `403 Источник сессии не разрешён` | Origin нет в `azp`-allowlist | Добавьте домен в `CLERK_AUTHORIZED_PARTIES` или `KAEL_ALLOWED_ORIGINS` |
| CORS-ошибка в браузере | Origin нет в `KAEL_ALLOWED_ORIGINS` | Укажите точный origin со схемой, без `/` на конце |
| Роль не меняется после правки metadata | Старый токен в сессии | Выйдите и войдите; проверьте шаблон `kael` |
| Маскот не появляется | Не загружены `mascot/slime.js` или `slime.css` | Проверьте файлы на InfinityFree и ошибки 404 |
| Сборка падает на типах | Изменения в API/переводах | `npm run typecheck`, исправьте ошибки |
| После деплоя старый интерфейс | Кэш браузера или старые файлы | `Ctrl+F5`, удалите старые чанки в `htdocs` |
| MCP-сервер просит авторизацию по кругу | Redirect URI не совпадает с настройками провайдера | Сверьте `KAEL_PUBLIC_API_URL` / `KAEL_MCP_REDIRECT_URI` и зарегистрированный callback |
| MCP-токены пропали после redeploy | Эфемерный диск Render | Подключите persistent disk или авторизуйте серверы заново |
| `/privacy/` открывается, но без стилей | Не загружен `_next/` из новой сборки | Загрузите **всё** содержимое `out/`, удалите старые чанки |
| CSP блокирует Clerk | Домен Clerk отсутствует в `script-src`/`connect-src` | Обновите `.htaccess` и пересоберите фронтенд |

---

## 7. Чек-лист перед публикацией

Clerk:

- [ ] Приложение создано, email + password включён.
- [ ] JWT-шаблон называется `kael` и содержит claim `role`.
- [ ] Пользователям выставлен `public_metadata.role`.
- [ ] `CLERK_ISSUER` совпадает с Frontend API URL.
- [ ] `https://kael-ai.ct.ws` добавлен в allowed origins.
- [ ] Production instance подтверждён (или осознанно используется dev instance).

Render:

- [ ] `KAEL_ENV=production`.
- [ ] `KAEL_SECRET_KEY` задан (Blueprint: `generateValue: true`).
- [ ] `KAEL_TRUST_PROXY_HEADERS=1`.
- [ ] `KAEL_PUBLIC_API_URL` или `RENDER_EXTERNAL_URL` даёт правильный OAuth callback.
- [ ] `KAEL_PUBLIC_FRONTEND_URL=https://kael-ai.ct.ws`.
- [ ] `OPENROUTER_API_KEY`, `GROQ_API_KEY`, `ZEROCAT_API_KEY`, `GEMINI_API_KEY` заданы по необходимости.
- [ ] `CLERK_ISSUER` задан.
- [ ] `CLERK_AUTHORIZED_PARTIES` содержит продакшен-origin.
- [ ] `KAEL_ALLOWED_ORIGINS` содержит `https://kael-ai.ct.ws`.
- [ ] `/health` отвечает `{"status":"ok"}`.
- [ ] `/api/me` без токена отвечает `401`.
- [ ] `CLERK_SECRET_KEY` отсутствует на фронтенде и в статике.

Frontend:

- [ ] `.env.production` содержит backend URL и publishable key.
- [ ] `npm run theme:light` выполнен после последних изменений UI.
- [ ] `npm run typecheck` проходит.
- [ ] `npm run build` создаёт `out/` без ошибок.
- [ ] В `out/` есть `mascot/slime.js`, `mascot/slime.css` и `.htaccess`.
- [ ] В `out/` есть `privacy/index.html`, `terms/index.html`, `security/index.html`.
- [ ] Содержимое `out/` загружено в `htdocs`.
- [ ] HTTPS включён, старые файлы удалены.
- [ ] CSP и HSTS приходят в заголовках ответа.

Проверка доступа:

- [ ] `admin` видит dev-режим и повышенные лимиты.
- [ ] `tester` получает Elite без оплаты.
- [ ] `user` получает бесплатный тариф.
- [ ] Выход и повторный вход работают.
- [ ] Маскот реагирует на thinking, typing, ошибку и клик.
- [ ] Правовые страницы открываются в приватном окне без входа.
- [ ] MCP: read-only инструмент выполняется без подтверждения, изменяющий — только после подтверждения.
