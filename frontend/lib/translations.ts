import type { ResponseMode } from "./modes";
import type { TierId } from "./tiers";

export type Language = "ru" | "uk" | "en";

export const LANGUAGE_STORAGE_KEY = "kael-language";

export const LANGUAGES: ReadonlyArray<{
  id: Language;
  label: string;
  name: string;
}> = [
  { id: "ru", label: "RU", name: "Русский" },
  { id: "uk", label: "UA", name: "Українська" },
  { id: "en", label: "EN", name: "English" },
];

export function isLanguage(value: unknown): value is Language {
  return value === "ru" || value === "uk" || value === "en";
}

export function localeFor(language: Language): string {
  if (language === "uk") {
    return "uk-UA";
  }
  if (language === "en") {
    return "en-US";
  }
  return "ru-RU";
}

const ru = {
  "app.online": "онлайн",
  "app.offline": "офлайн",

  "header.openMenu": "Открыть меню",
  "header.chatHistory": "История диалога",
  "header.sfxOff": "Выключить звуки интерфейса",
  "header.sfxOn": "Включить звуки интерфейса",
  "header.sfxEnabled": "Звуки интерфейса включены",
  "header.sfxDisabled": "Звуки интерфейса выключены",
  "header.ambientOff": "Выключить фоновый эмбиент",
  "header.ambientOn": "Включить фоновый эмбиент",
  "header.ambientEnabled": "Фоновый эмбиент включён",
  "header.ambientDisabled": "Фоновый эмбиент выключен",

  "language.label": "Язык",
  "language.select": "Выбрать язык",

  "auth.loading": "Проверяем сессию…",
  "auth.slow": "Сервер просыпается, это может занять до минуты.",
  "auth.signInTitle": "Вход в KAEL",
  "auth.signInSubtitle": "Войдите или создайте аккаунт, чтобы продолжить.",
  "auth.configMissing": "Clerk не настроен",
  "auth.configHint":
    "Добавьте NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY в .env.production и пересоберите фронтенд.",
  "auth.sessionError": "Не удалось проверить сессию.",
  "auth.signOut": "Выйти",
  "auth.retry": "Повторить",
  "auth.connectError": "Не удалось подключиться к серверу",
  "auth.role.admin": "Администратор",
  "auth.role.tester": "Тестировщик",
  "auth.role.user": "Пользователь",

  "tour.newChat.title": "Новый чат",
  "tour.newChat.text": "Жми сюда, чтобы начать свежий диалог с KAEL.",
  "tour.mode.title": "Режим ответа",
  "tour.mode.text":
    "Быстрый, сбалансированный или глубокий. Выбирай под задачу.",
  "tour.model.title": "Модель",
  "tour.model.text":
    "Здесь переключается ИИ-модель. Можно сравнить ответы.",
  "tour.attach.title": "Файлы",
  "tour.attach.text":
    "Скрепка: прикрепи файл или картинку к сообщению.",
  "tour.input.title": "Сообщение",
  "tour.input.text": "Пиши вопрос сюда. Enter отправляет.",
  "tour.send.title": "Отправка",
  "tour.send.text": "Или тапни стрелку. Поехали!",
  "tour.skip": "Пропустить",
  "tour.next": "Дальше",
  "tour.done": "Готово",
  "tour.step": "Шаг {current} из {total}",
  "tour.close": "Закрыть тур",

  "changelog.eyebrow": "История версий",
  "changelog.title": "Changelog KAEL",
  "changelog.subtitle":
    "От старого сайта до v1.7 — все заметные изменения без маркетингового шума.",
  "changelog.close": "Закрыть changelog",
  "changelog.closeBackdrop": "Закрыть таблицу изменений",
  "changelog.open": "Что нового",
  "changelog.openHint": "Таблица изменений KAEL",
  "changelog.versionColumn": "Версия",
  "changelog.changesColumn": "Изменения",
  "changelog.current": "Текущая",
  "changelog.legacy": "Старый сайт",
  "changelog.summary": "{count} релизов · от v1.0 до {version}",
  "changelog.footer":
    "KAEL развивается итеративно: каждый релиз делает интерфейс спокойнее, а ответы точнее.",

  "changelog.v17.tagline": "MCP и безопасность",
  "changelog.v17.item0":
    "Любые MCP-серверы: OAuth 2.1, bearer-токены и анонимный доступ.",
  "changelog.v17.item1":
    "Инструменты только для чтения выполняются сразу, изменяющие действия требуют подтверждения в чате.",
  "changelog.v17.item2":
    "OAuth discovery, динамическая регистрация, PKCE S256 и refresh-токены; токены шифруются на сервере.",
  "changelog.v17.item3":
    "Защита от SSRF, лимиты запросов, журнал аудита и редактирование ошибок.",
  "changelog.v17.item4":
    "Публичные страницы политики конфиденциальности, условий и безопасности.",
  "changelog.v17.item5":
    "Усиленные заголовки безопасности и безопасные ссылки в ответах.",

  "changelog.v16.tagline": "Темы и расширения",
  "changelog.v16.item0":
    "Две темы: тёмная изумрудная и светлая зелёная. Переключаются сразу.",
  "changelog.v16.item1":
    "Выбор шрифта интерфейса и акцентного шрифта — все с кириллицей.",
  "changelog.v16.item2":
    "Коннекторы: реальный статус пяти провайдеров — OpenRouter, Groq, Ollama, ZeroCat и Gemini — и выбор модели для каждого.",
  "changelog.v16.item3":
    "Плагины и навыки: живое демо, быстрый старт, changelog после тура и шесть навыков в промпте.",
  "changelog.v16.item4":
    "Экран входа Clerk следует теме, шрифту и языку, а настройки получили раздел «Расширения».",

  "changelog.v15.tagline": "Живой старт",
  "changelog.v15.item0":
    "Живая демонстрация на стартовом экране: поле печатает пример, слайм реагирует.",
  "changelog.v15.item1":
    "Маскот-слайм: реакции на мышление, печать, ошибки и клики.",
  "changelog.v15.item2":
    "Интерактивный тур по интерфейсу и повторный запуск из настроек.",
  "changelog.v15.item3":
    "Changelog с историей от v1.0 и кнопка «Что нового» в шапке.",
  "changelog.v15.item4":
    "Финальная полировка Dark Emerald, мобильной шапки и доступности.",

  "changelog.v14.tagline": "Настройки и персонализация",
  "changelog.v14.item0":
    "Настройки в четырёх разделах: аккаунт, клиент, персонализация и прочее.",
  "changelog.v14.item1":
    "Имя профиля через Clerk, стиль ответов и свои инструкции.",
  "changelog.v14.item2":
    "Звуки интерфейса, эмбиент, Enter / Ctrl+Enter и автоскролл.",
  "changelog.v14.item3":
    "Уменьшение движения и отключение маскота.",
  "changelog.v14.item4":
    "RU / UK / EN и локальная история на устройстве.",

  "changelog.v13.tagline": "Ядро ассистента",
  "changelog.v13.item0":
    "FastAPI-бэкенд и три провайдера: OpenRouter, Groq и Ollama.",
  "changelog.v13.item1":
    "Стриминг ответов и индикатор этапов работы.",
  "changelog.v13.item2":
    "Вложения: PDF, изображения, текст и код.",
  "changelog.v13.item3":
    "Три режима ответа и выбор модели.",
  "changelog.v13.item4":
    "Артефакты файлов, тарифы и учёт токенов.",

  "changelog.v12.tagline": "Dark Emerald",
  "changelog.v12.item0":
    "Палитра Dark Emerald: #0A0A0A, #161616 и #10B981.",
  "changelog.v12.item1":
    "Убраны неоновые градиенты, свечения, шум и лишние эффекты.",
  "changelog.v12.item2":
    "Единая типографика, границы и состояния компонентов.",
  "changelog.v12.item3":
    "Адаптивная вёрстка и доступность с клавиатуры.",

  "changelog.v11.tagline": "Аккаунты и роли",
  "changelog.v11.item0":
    "Вход через Clerk и личный профиль.",
  "changelog.v11.item1":
    "Роли admin / tester / user с разными уровнями доступа.",
  "changelog.v11.item2":
    "Проверка JWT на бэкенде через JWKS.",
  "changelog.v11.item3":
    "Подготовка к тарифам и монетизации.",

  "changelog.v10.tagline": "Старый сайт",
  "changelog.v10.item0": "Первый публичный сайт KAEL.",
  "changelog.v10.item1": "Простой чат и базовая вёрстка.",
  "changelog.v10.item2": "Без аккаунтов, истории и настроек.",

  "landing.demo.eyebrow": "Живая демонстрация",
  "landing.demo.pause": "Пауза",
  "landing.demo.resume": "Продолжить",
  "landing.demo.example": "Пример {index}",
  "landing.demo.typing": "Печатаю запрос",
  "landing.demo.thinking": "Думаю",
  "landing.demo.answering": "Отвечаю",
  "landing.demo.done": "Готово",
  "landing.demo.paused": "Пауза",
  "landing.demo.try": "Попробовать запрос",
  "landing.demo.note":
    "Это пример. Ответы подготовлены заранее и не тратят токены.",
  "landing.demo.poke": "Ткни слайма",
  "landing.demo.explain.tag": "Разбор",
  "landing.demo.explain.prompt":
    "Объясни, как работает кэш браузера, простыми словами.",
  "landing.demo.explain.answer":
    "Браузер сохраняет копии файлов, чтобы не скачивать их заново. Кэш ускоряет загрузку, но иногда показывает старую версию — поэтому важно управлять сроками жизни.",
  "landing.demo.code.tag": "Код",
  "landing.demo.code.prompt":
    "Напиши debounce на TypeScript и назови крайние случаи.",
  "landing.demo.code.answer":
    "Debounce откладывает вызов, пока не закончится серия событий. Не забудьте очистить таймер, сохранить контекст и вернуть функцию отмены.",
  "landing.demo.compare.tag": "Выбор",
  "landing.demo.compare.prompt":
    "Сравни REST и WebSocket для чата в небольшом продукте.",
  "landing.demo.compare.answer":
    "Для чата WebSocket даёт мгновенные обновления, а REST проще для истории и модерации. Начните с REST и добавьте WebSocket, когда задержка станет заметной.",
  "landing.quickStart": "Быстрый старт",

  "landing.badge": "Прямой диалог",
  "landing.title1": "Думай точнее.",
  "landing.title2": "Делай меньше шума.",
  "landing.description":
    "KAEL разбирает сложное на понятные части, пишет код без лишних абстракций и собирает документы, которые не стыдно открыть.",

  "capabilities.title": "Что умеет KAEL",
  "capabilities.code.title": "Код",
  "capabilities.code.description": "Пишет, чинит и объясняет код.",
  "capabilities.docs.title": "Документы",
  "capabilities.docs.description": "Собирает README и инструкции.",
  "capabilities.files.title": "Вложения",
  "capabilities.files.description": "Читает изображения, PDF и код.",
  "capabilities.noImages": "Не генерирует картинки и видео",

  "starter.explain.title": "Разложить сложное",
  "starter.explain.description":
    "Объяснить идею простыми словами и без маркетинга.",
  "starter.explain.prompt":
    "Объясни, как устроена память в больших языковых моделях, простыми словами. Покажи, где обычно ошибаются.",
  "starter.code.title": "Спроектировать код",
  "starter.code.description":
    "Минимальная реализация и разбор решений.",
  "starter.code.prompt":
    "Напиши минимальную реализацию очереди задач на TypeScript. Объясни ключевые решения и назови крайние случаи.",
  "starter.compare.title": "Сравнить подходы",
  "starter.compare.description":
    "Увидеть компромиссы и получить рекомендацию.",
  "starter.compare.prompt":
    "Сравни REST и события в реальном времени для небольшого продукта. Покажи компромиссы и дай рекомендацию.",
  "starter.document.title": "Собрать документ",
  "starter.document.description":
    "Получить готовый файл с чистой структурой.",
  "starter.document.prompt":
    "Собери короткий README для небольшого FastAPI-сервиса с одним эндпоинтом /api/chat.",

  "chat.you": "Вы",
  "chat.responseMissing": "Ответ не получен",
  "chat.attachmentOnly": "Проанализируй вложения.",
  "chat.newDialog": "Новый диалог",
  "chat.mcp.approvalTitle": "Нужно подтверждение",
  "chat.mcp.approvalHint":
    "Эти инструменты могут изменить данные. Проверьте аргументы и выберите, что разрешить.",
  "chat.mcp.approve": "Разрешить",
  "chat.mcp.auto": "автоматически",
  "chat.mcp.arguments": "Аргументы",
  "chat.mcp.denyAll": "Отклонить всё",
  "chat.mcp.selectAll": "Выбрать всё",
  "chat.mcp.approveSelected": "Разрешить ({count})",
  "chat.mcp.approvalSending": "Выполняем…",
  "chat.mcp.trace": "MCP",
  "chat.mcp.trace.ok": "успешно",
  "chat.mcp.trace.error": "ошибка",
  "chat.mcp.trace.denied": "отклонено",
  "chat.mcp.approvalExpired":
    "Подтверждение истекло. Отправьте сообщение ещё раз.",
  "chat.mcp.approvalError":
    "Не удалось продолжить после подтверждения.",

  "error.timeout":
    "Сервер не ответил за {seconds} секунд. Проверьте соединение и повторите запрос.",
  "error.connect":
    "Не удалось подключиться к FastAPI. Проверьте, что сервер запущен на {url}.",
  "error.unknown": "Неизвестная ошибка при отправке сообщения.",
  "error.backendHttp": "Бэкенд вернул ошибку HTTP {status}.",
  "error.backendEmpty": "Бэкенд вернул пустой ответ.",

  "attachment.kind.pdf": "PDF",
  "attachment.kind.code": "Код",
  "attachment.kind.image": "Изображение",
  "attachment.kind.text": "Текст",
  "attachment.maxFiles": "Можно прикрепить не больше {count} файлов.",
  "attachment.limit": "Лимит — {count} вложений. Лишние файлы не добавлены.",
  "attachment.unreadable": "Не удалось прочитать файл.",
  "attachment.totalSize":
    "Общий размер вложений не должен превышать {size}.",
  "attachment.remove": "Удалить вложение {name}",
  "attachment.hideError": "Скрыть сообщение об ошибке",
  "attachment.drop": "Отпустите файл, чтобы прикрепить",
  "attachment.attachFile": "Прикрепить файл",
  "attachment.attachHint": "Прикрепить PDF, текст или код",
  "attachment.addImage": "Добавить изображение или скриншот",
  "attachment.addImageHint": "Добавить изображение или скриншот",
  "attachment.reading": "Читаю вложения…",
  "attachment.ready": "{count} из {max} · можно отправить",
  "attachment.enterToSend": "Enter — отправить",
  "attachment.enterToSendOff": "Ctrl+Enter — отправить",
  "attachment.readError": "Не удалось прочитать файл «{name}».",
  "attachment.imageOpenError": "Не удалось открыть изображение.",
  "attachment.imagePrepareError": "Браузер не смог подготовить изображение.",
  "attachment.emptyFile": "Файл «{name}» пустой.",
  "attachment.tooManyChars":
    "Файл «{name}» слишком большой: максимум {count} тыс. символов.",
  "attachment.tooLarge": "Файл «{name}» больше {size}.",
  "attachment.unsupported":
    "Формат «{ext}» не поддерживается. Прикрепите PDF, изображение, текст или код.",
  "attachment.noExtension": "без расширения",

  "composer.placeholder": "Спросите KAEL...",
  "composer.messageAria": "Сообщение для KAEL",
  "composer.generating": "Генерация ответа",
  "composer.send": "Отправить сообщение",

  "sidebar.history": "История",
  "sidebar.newChat": "Новый чат",
  "sidebar.dialogs": "Диалоги",
  "sidebar.empty": "Пока пусто. Первый вопрос — внизу.",
  "sidebar.apiOnline": "API онлайн",
  "sidebar.apiOffline": "API офлайн",
  "sidebar.tierAria": "Тариф и лимиты",
  "sidebar.tierAriaName": "Тариф и лимиты: {tier}",
  "sidebar.expand": "Развернуть сайдбар",
  "sidebar.collapse": "Свернуть сайдбар",
  "sidebar.closeMenu": "Закрыть меню",
  "sidebar.wait": "Дождитесь ответа KAEL",
  "sidebar.historyAria": "История диалогов",
  "sidebar.tokensLeft": "Осталось токенов: {count}",
  "sidebar.unlimited": "Без ограничений",
  "sidebar.tierTitle": "{tier}: осталось токенов: {count}",
  "sidebar.tierTitleUnlimited": "{tier}: без ограничений",

  "mode.fast.label": "Быстрый",
  "mode.fast.description": "Мгновенный ответ без длинных рассуждений",
  "mode.balanced.label": "Сбалансированный",
  "mode.balanced.description": "Стандартный ответ с шагами мышления",
  "mode.deep.label": "Глубокий анализ",
  "mode.deep.description": "Глубокий разбор, архитектура и больше бюджета",
  "mode.aria": "Режим ответа: {label}",
  "mode.listAria": "Режим ответа",
  "mode.hint": "Сколько усилий тратить на ответ",

  "model.aria": "Модель: {name}",
  "model.fallback": "Модель",
  "model.selectAria": "Выбор модели",
  "model.group.cloud": "облако",
  "model.group.fast": "быстро",
  "model.group.local": "локально",
  "model.group.zerocat": "мультимодель",
  "model.group.gemini": "Google",
  "model.desc.gpt4oMini": "Быстрый универсал для повседневных задач",
  "model.desc.gpt4o": "Больше глубины на сложных запросах",
  "model.desc.claude": "Сильный в коде и длинном контексте",
  "model.desc.deepseek": "Спокойные рассуждения без лишнего шума",
  "model.desc.gptOss120b": "Мощная модель с почти мгновенным ответом",
  "model.desc.gptOss20b": "Самая быстрая для коротких задач",
  "model.desc.llama3": "Работает на вашем компьютере",
  "model.desc.mistral": "Лёгкая локальная модель для черновиков",
  "model.desc.zerocatGpt": "Флагман GPT через ZeroCat",
  "model.desc.zerocatClaude": "Claude для кода и длинного контекста",
  "model.desc.zerocatDeepseek": "Быстрый и недорогой для повседневных задач",
  "model.desc.zerocatGemini": "Быстрая мультимодальная модель через ZeroCat",
  "model.desc.geminiFlash": "Быстрая модель Google с поддержкой изображений",
  "model.desc.geminiPro": "Глубокие рассуждения и длинный контекст",

  "thinking.processing": "Обрабатываю запрос...",
  "thinking.done": "Готово",
  "thinking.doneIn": "Готово за {seconds} с",
  "thinking.short": "Собираю короткий ответ без длинных рассуждений...",
  "thinking.deepExtra0": "Проверяю архитектуру и скрытые ограничения...",
  "thinking.deepExtra1":
    "Сверяю вывод с задачей и оставляю только надёжное...",
  "thinking.coding.0": "Разбираю задачу, входные данные и ограничения...",
  "thinking.coding.1": "Проектирую минимальное рабочее решение...",
  "thinking.coding.2": "Проверяю синтаксис и крайние случаи...",
  "thinking.coding.3": "Убираю лишнее и собираю ответ...",
  "thinking.analysis.0": "Отделяю факты от допущений...",
  "thinking.analysis.1": "Проверяю аргументы и слабые места...",
  "thinking.analysis.2": "Сравниваю альтернативные объяснения...",
  "thinking.analysis.3": "Структурирую выводы и убираю шум...",
  "thinking.document.0": "Определяю формат и целевую аудиторию...",
  "thinking.document.1": "Собираю структуру документа...",
  "thinking.document.2": "Формулирую содержимое разделов...",
  "thinking.document.3": "Проверяю полноту и единый тон...",
  "thinking.social.0": "Считываю тон и контекст сообщения...",
  "thinking.social.1": "Отделяю полезное от лишнего...",
  "thinking.social.2": "Формулирую короткий человеческий ответ...",
  "thinking.general.0": "Выделяю намерение запроса...",
  "thinking.general.1": "Проверяю контекст и доступные данные...",
  "thinking.general.2": "Собираю практичный ответ...",
  "thinking.general.3": "Формулирую следующий шаг...",

  "tiers.eyebrow": "Тарифы и использование",
  "tiers.title": "Тариф и лимиты",
  "tiers.subtitleDev":
    "Доступ администратора. Лимиты отключены.",
  "tiers.subtitle": "Лимиты, модели и текущий уровень доступа.",
  "tiers.close": "Закрыть",
  "tiers.closeBackdrop": "Закрыть панель тарифов",
  "tiers.devActivated":
    "Секретный тариф «Друг разработчика» активирован. Лимиты отключены.",
  "tiers.current": "Текущий тариф",
  "tiers.devBadge": "DEV",
  "tiers.unlimited": "Без ограничений",
  "tiers.tokensLeft": "{count} токенов осталось",
  "tiers.tokensProcessed": "{count} токенов обработано",
  "tiers.tokensOf": "{used} из {limit} токенов",
  "tiers.progressAria": "Использование токенов",
  "tiers.percentAria": "{percent} процентов",
  "tiers.unlimitedNote":
    "Лимиты не применяются. Доступ открыт администраторам KAEL.",
  "tiers.limitReset":
    "Лимит обновится {date}. Расход считается по ответам KAEL.",
  "tiers.active": "Активен",
  "tiers.secret": "Секретно",
  "tiers.currentButton": "Текущий тариф",
  "tiers.unavailable": "Пока что недоступно",
  "tiers.unavailableTitle":
    "Оплата и переход между тарифами появятся позже",
  "tiers.activate": "Активировать",
  "tiers.footer":
    "Тариф определяется ролью аккаунта. Оплата и переход между планами появятся позже.",

  "tier.free.name": "Free Tier",
  "tier.free.price": "0 ₽",
  "tier.free.description":
    "Для знакомства с KAEL и личных экспериментов.",
  "tier.free.feature0": "100 тыс. токенов в месяц",
  "tier.free.feature1": "Базовые модели",
  "tier.free.feature2": "История диалогов",
  "tier.pro.name": "Pro Creator",
  "tier.pro.price": "990 ₽ / мес",
  "tier.pro.description":
    "Для ежедневной работы, кода и документов.",
  "tier.pro.feature0": "1 млн токенов в месяц",
  "tier.pro.feature1": "Все модели и Deep Think",
  "tier.pro.feature2": "Приоритетная очередь",
  "tier.elite.name": "Elite SaaS",
  "tier.elite.price": "2 990 ₽ / мес",
  "tier.elite.description":
    "Для команд и тяжёлых рабочих нагрузок.",
  "tier.elite.feature0": "10 млн токенов в месяц",
  "tier.elite.feature1": "Максимальный контекст",
  "tier.elite.feature2": "Ранний доступ к функциям",
  "tier.dev.name": "Администратор",
  "tier.dev.price": "∞",
  "tier.dev.description":
    "Полный доступ для администраторов KAEL. Без лимитов и очередей.",
  "tier.dev.feature0": "Неограниченные токены",
  "tier.dev.feature1": "Все модели и Deep Think",
  "tier.dev.feature2": "Прямой доступ к новым функциям",

  "file.aria": "Файл {name}",
  "file.lines": "{count} строк",
  "file.copyAria": "Скопировать содержимое файла",
  "file.copy": "Копировать",
  "file.copied": "Скопировано",
  "file.unavailable": "Недоступно",
  "file.downloadAria": "Скачать файл",
  "file.download": "Скачать",
  "file.expandAria": "Развернуть файл",
  "file.collapseAria": "Свернуть файл",
  "file.expand": "Развернуть",
  "file.collapse": "Свернуть",

  "legal.nav": "Правовая информация",
  "legal.privacy": "Политика конфиденциальности",
  "legal.terms": "Условия использования",
  "legal.security": "Безопасность",
  "legal.back": "Вернуться в KAEL",
  "legal.documentNav": "Правовые документы",
  "legal.toc": "Содержание",
  "legal.contactTelegram": "Написать в Telegram",
  "legal.footer":
    "KAEL — независимый AI-интерфейс. Документы описывают текущую практику сервиса.",

  "settings.eyebrow": "Настройки",
  "settings.title": "Настройки KAEL",
  "settings.subtitle": "Аккаунт, клиент и персонализация ассистента.",
  "settings.close": "Закрыть настройки",
  "settings.closeBackdrop": "Закрыть настройки",
  "settings.saved": "Сохранено",
  "settings.section.account": "Аккаунт",
  "settings.section.accountHint": "Профиль, роль и тариф",
  "settings.section.client": "Клиент",
  "settings.section.clientHint": "Язык, звук, тема и ввод",
  "settings.section.extensions": "Расширения",
  "settings.section.extensionsHint":
    "Коннекторы, MCP-серверы, плагины и навыки",
  "settings.section.personalization": "Персонализация",
  "settings.section.personalizationHint": "Имя, стиль и инструкции",
  "settings.section.other": "Другое",
  "settings.section.otherHint": "Данные, тур и версия",

  "settings.account.profile": "Профиль",
  "settings.account.nameLabel": "Отображаемое имя",
  "settings.account.namePlaceholder": "Как к вам обращаться",
  "settings.account.nameHint":
    "Имя хранится в Clerk и показывается в интерфейсе KAEL.",
  "settings.account.saveName": "Сохранить имя",
  "settings.account.saving": "Сохраняем…",
  "settings.account.nameSaved": "Имя обновлено",
  "settings.account.nameError": "Не удалось обновить имя",
  "settings.account.email": "Email",
  "settings.account.emailEmpty": "Не указан",
  "settings.account.role": "Роль",
  "settings.account.plan": "Тариф",
  "settings.account.planHint": "Лимиты и доступные модели.",
  "settings.account.managePlan": "Тарифы и лимиты",
  "settings.account.signOut": "Выйти из аккаунта",
  "settings.account.signOutHint":
    "Локальная история останется на этом устройстве.",
  "settings.account.deviceNote":
    "Профиль и тариф синхронизируются через Clerk. История диалогов и настройки хранятся только на этом устройстве.",

  "settings.client.language": "Язык интерфейса",
  "settings.client.languageHint":
    "Меняет подписи, ответы KAEL и формат дат.",
  "settings.client.sound": "Звуки интерфейса",
  "settings.client.soundHint":
    "Короткие отклики на нажатия, отправку и ошибки.",
  "settings.client.ambient": "Фоновый звук",
  "settings.client.ambientHint": "Тихий эмбиент во время работы.",
  "settings.client.enterToSend": "Enter отправляет сообщение",
  "settings.client.enterToSendHint":
    "Если выключено, Enter переносит строку, а отправляет Ctrl+Enter.",
  "settings.client.autoScroll": "Прокручивать к ответу",
  "settings.client.autoScrollHint":
    "Автоматически показывать последнее сообщение.",
  "settings.client.theme": "Тема оформления",
  "settings.client.themeHint":
    "Тёмная изумрудная или светлая зелёная. Применяется сразу.",
  "settings.client.theme.dark": "Тёмная",
  "settings.client.theme.darkHint": "Глубокий графит с изумрудным акцентом.",
  "settings.client.theme.light": "Светлая",
  "settings.client.theme.lightHint": "Тёплый светлый фон с зелёным акцентом.",
  "settings.client.interfaceFont": "Шрифт интерфейса",
  "settings.client.interfaceFontHint":
    "Влияет на подписи, чат и элементы управления.",
  "settings.client.displayFont": "Акцентный шрифт",
  "settings.client.displayFontHint": "Заголовки, логотип и крупные акценты.",
  "settings.client.font.manrope": "Manrope",
  "settings.client.font.inter": "Inter",
  "settings.client.font.onest": "Onest",
  "settings.client.font.unbounded": "Unbounded",
  "settings.client.font.system": "Системный",

  "settings.extensions.connectors": "Коннекторы провайдеров",
  "settings.extensions.connectorsHint":
    "Ключи хранятся на сервере. Здесь видно, какие провайдеры отвечают, и можно выбрать модель.",
  "settings.extensions.refresh": "Проверить",
  "settings.extensions.checking": "Проверяем",
  "settings.extensions.connected": "Подключён",
  "settings.extensions.notConfigured": "Не настроен",
  "settings.extensions.modelFor": "Модель для {provider}",
  "settings.extensions.chooseModel": "Выберите модель",
  "settings.extensions.connector.openrouterHint":
    "Облачные модели через OpenRouter API.",
  "settings.extensions.connector.groqHint": "Быстрые ответы через Groq API.",
  "settings.extensions.connector.ollamaHint":
    "Локальные модели через Ollama на вашем сервере.",
  "settings.extensions.connector.zerocatHint":
    "GPT, Claude, DeepSeek и Gemini через ZeroCat API.",
  "settings.extensions.connector.geminiHint":
    "Прямой доступ к моделям Google Gemini.",
  "settings.extensions.plugins": "Плагины",
  "settings.extensions.pluginsHint":
    "Включайте и выключайте части интерфейса KAEL.",
  "settings.extensions.plugin.liveDemo": "Живое демо",
  "settings.extensions.plugin.liveDemoHint":
    "Показывать демонстрацию на стартовом экране.",
  "settings.extensions.plugin.quickStart": "Быстрый старт",
  "settings.extensions.plugin.quickStartHint":
    "Показывать готовые запросы под чатом.",
  "settings.extensions.plugin.changelogAuto": "Changelog после тура",
  "settings.extensions.plugin.changelogAutoHint":
    "Открывать список изменений после первого прохождения тура.",
  "settings.extensions.skills": "Навыки",
  "settings.extensions.skillsHint":
    "KAEL добавляет выбранные инструкции в системный промпт.",

  "settings.mcp.title": "MCP-серверы",
  "settings.mcp.hint":
    "Подключайте любые MCP-серверы: KAEL сам найдёт инструменты, покажет их в чате и попросит подтверждение перед изменениями.",
  "settings.mcp.add": "Добавить сервер",
  "settings.mcp.url": "URL MCP-сервера",
  "settings.mcp.urlPlaceholder": "https://example.com/mcp",
  "settings.mcp.urlHint":
    "Укажите Streamable HTTP endpoint. Для удалённых серверов нужен HTTPS.",
  "settings.mcp.name": "Название",
  "settings.mcp.namePlaceholder": "Например, Notion",
  "settings.mcp.auth": "Авторизация",
  "settings.mcp.auth.auto": "Авто",
  "settings.mcp.auth.none": "Без авторизации",
  "settings.mcp.auth.bearer": "Bearer-токен",
  "settings.mcp.auth.oauth": "OAuth 2.1",
  "settings.mcp.token": "Токен",
  "settings.mcp.tokenHint":
    "Токен хранится зашифрованным и не возвращается в браузер.",
  "settings.mcp.connect": "Подключить",
  "settings.mcp.adding": "Подключаем…",
  "settings.mcp.urlMustBeHttps":
    "HTTPS обязателен. HTTP и localhost разрешены только в разработке.",
  "settings.mcp.urlRequired":
    "Укажите полный URL сервера, например https://example.com/mcp.",
  "settings.mcp.oauthReady":
    "Сервер готов к авторизации. Откройте ссылку и подтвердите доступ.",
  "settings.mcp.oauthAfter":
    "После подтверждения вернитесь сюда и нажмите «Проверить».",
  "settings.mcp.openAuth": "Открыть авторизацию",
  "settings.mcp.loading": "Загружаем MCP-серверы…",
  "settings.mcp.empty": "Пока нет MCP-серверов",
  "settings.mcp.emptyHint":
    "Добавьте endpoint сервера. KAEL выполнит initialize, получит список инструментов и подключит их к чату.",
  "settings.mcp.check": "Проверить",
  "settings.mcp.reconnect": "Авторизовать",
  "settings.mcp.delete": "Удалить",
  "settings.mcp.deleteYes": "Удалить",
  "settings.mcp.cancel": "Отмена",
  "settings.mcp.useInChat": "Использовать в чате",
  "settings.mcp.allowWrite": "Разрешить изменения без подтверждения",
  "settings.mcp.allowWriteHint":
    "Опасно: инструменты смогут менять данные автоматически. Оставьте выключенным, если не доверяете серверу полностью.",
  "settings.mcp.lastError": "Последняя ошибка: {error}",
  "settings.mcp.securityNote":
    "KAEL проверяет URL, шифрует токены и считает результаты инструментов недоверенными. Подключайте только серверы, которым доверяете.",
  "settings.mcp.noTools": "Инструменты не найдены. Проверьте сервер.",
  "settings.mcp.toolsTitle": "Инструменты",
  "settings.mcp.readOnly": "чтение",
  "settings.mcp.write": "запись",
  "settings.mcp.status.new": "Новый",
  "settings.mcp.status.connected": "Подключён",
  "settings.mcp.status.authRequired": "Нужна авторизация",
  "settings.mcp.status.error": "Ошибка",
  "settings.mcp.error": "Не удалось выполнить действие с MCP-сервером.",

  "settings.personalization.name": "Как к вам обращаться",
  "settings.personalization.namePlaceholder": "Например, Алекс",
  "settings.personalization.nameHint":
    "KAEL будет использовать это имя в ответах.",
  "settings.personalization.style": "Стиль ответов",
  "settings.personalization.styleHint":
    "Дополнительный тон поверх выбранного режима.",
  "settings.personalization.style.default": "Как обычно",
  "settings.personalization.style.concise": "Кратко",
  "settings.personalization.style.detailed": "Подробно",
  "settings.personalization.style.friendly": "Дружелюбно",
  "settings.personalization.style.direct": "По делу",
  "settings.personalization.instructions": "Свои инструкции",
  "settings.personalization.instructionsHint":
    "До {max} символов. Добавляются в системный промпт KAEL.",
  "settings.personalization.instructionsPlaceholder":
    "Например: отвечай как наставник, приводи примеры на TypeScript и не используй эмодзи.",
  "settings.personalization.instructionsCounter": "{count} / {max}",
  "settings.personalization.mascot": "Маскот-слайм",
  "settings.personalization.mascotHint":
    "Показывать спутника, который бегает по экрану.",
  "settings.personalization.reduceMotion": "Уменьшить движение",
  "settings.personalization.reduceMotionHint":
    "Отключает анимации, бег маскота и плавные переходы.",
  "settings.personalization.privacy":
    "Инструкции уходят только в запросе к модели и не сохраняются на сервере.",

  "settings.other.data": "Данные на устройстве",
  "settings.other.dataHint":
    "История диалогов и настройки хранятся в localStorage браузера.",
  "settings.other.stats": "{sessions} диалогов · {messages} сообщений",
  "settings.other.clearHistory": "Очистить историю",
  "settings.other.clearHistoryHint":
    "Удаляет все диалоги на этом устройстве. Настройки останутся.",
  "settings.other.clearConfirm":
    "Очистить историю? Это действие нельзя отменить.",
  "settings.other.clear": "Очистить",
  "settings.other.reset": "Сбросить настройки",
  "settings.other.resetHint":
    "Вернуть язык, звук, ввод и персонализацию к значениям по умолчанию.",
  "settings.other.resetConfirm": "Сбросить все настройки?",
  "settings.other.resetAction": "Сбросить",
  "settings.other.restartTour": "Пройти тур заново",
  "settings.other.restartTourHint":
    "Покажет подсказки по основным элементам интерфейса.",
  "settings.other.about": "О KAEL",
  "settings.other.version": "Версия {version}",
  "settings.other.aboutText":
    "KAEL — AI-помощник с характером. Next.js на фронтенде, FastAPI на бэкенде.",
  "settings.other.legal": "Правовые документы",
  "settings.other.cancel": "Отмена",

  "skill.code.name": "Код",
  "skill.code.description":
    "Пишет и правит код с примерами и пояснениями.",
  "skill.explain.name": "Объяснение",
  "skill.explain.description": "Разбирает сложное простыми шагами.",
  "skill.debug.name": "Отладка",
  "skill.debug.description":
    "Ищет причину ошибки и предлагает проверяемое исправление.",
  "skill.summary.name": "Конспект",
  "skill.summary.description": "Сжимает текст до ключевых тезисов.",
  "skill.translate.name": "Перевод",
  "skill.translate.description":
    "Переводит RU, UK и EN с сохранением тона.",
  "skill.documents.name": "Документы",
  "skill.documents.description":
    "Структурирует брифы, письма и спецификации.",

  "mascot.poke0": "Ой!",
  "mascot.poke1": "Хихи, щекотно!",
  "mascot.poke2": "Бульк!",
  "mascot.poke3": "Ещё разок!",

  "units.bytes": "{count} Б",
  "units.kb": "{count} КБ",
  "units.mb": "{count} МБ",
} as const;

export type TranslationKey = keyof typeof ru;
export type TranslationVars = Record<string, string | number>;
export type Translate = (
  key: TranslationKey,
  vars?: TranslationVars,
) => string;

const uk: Record<TranslationKey, string> = {
  "app.online": "онлайн",
  "app.offline": "офлайн",

  "header.openMenu": "Відкрити меню",
  "header.chatHistory": "Історія діалогу",
  "header.sfxOff": "Вимкнути звуки інтерфейсу",
  "header.sfxOn": "Увімкнути звуки інтерфейсу",
  "header.sfxEnabled": "Звуки інтерфейсу увімкнено",
  "header.sfxDisabled": "Звуки інтерфейсу вимкнено",
  "header.ambientOff": "Вимкнути фоновий ембієнт",
  "header.ambientOn": "Увімкнути фоновий ембієнт",
  "header.ambientEnabled": "Фоновий ембієнт увімкнено",
  "header.ambientDisabled": "Фоновий ембієнт вимкнено",

  "language.label": "Мова",
  "language.select": "Обрати мову",

  "auth.loading": "Перевіряємо сесію…",
  "auth.slow": "Сервер прокидається, це може зайняти до хвилини.",
  "auth.signInTitle": "Вхід у KAEL",
  "auth.signInSubtitle": "Увійдіть або створіть акаунт, щоб продовжити.",
  "auth.configMissing": "Clerk не налаштований",
  "auth.configHint":
    "Додайте NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY у .env.production і перезберіть фронтенд.",
  "auth.sessionError": "Не вдалося перевірити сесію.",
  "auth.signOut": "Вийти",
  "auth.retry": "Повторити",
  "auth.connectError": "Не вдалося підключитися до сервера",
  "auth.role.admin": "Адміністратор",
  "auth.role.tester": "Тестувальник",
  "auth.role.user": "Користувач",

  "tour.newChat.title": "Новий чат",
  "tour.newChat.text": "Тисни сюди, щоб почати свіжий діалог з KAEL.",
  "tour.mode.title": "Режим відповіді",
  "tour.mode.text":
    "Швидкий, збалансований або глибокий. Обирай під задачу.",
  "tour.model.title": "Модель",
  "tour.model.text":
    "Тут перемикається ШІ-модель. Можна порівняти відповіді.",
  "tour.attach.title": "Файли",
  "tour.attach.text":
    "Скрепка: прикріпи файл або зображення до повідомлення.",
  "tour.input.title": "Повідомлення",
  "tour.input.text": "Пиши питання сюди. Enter надсилає.",
  "tour.send.title": "Надсилання",
  "tour.send.text": "Або тапни стрілку. Поїхали!",
  "tour.skip": "Пропустити",
  "tour.next": "Далі",
  "tour.done": "Готово",
  "tour.step": "Крок {current} з {total}",
  "tour.close": "Закрити тур",

  "changelog.eyebrow": "Історія версій",
  "changelog.title": "Changelog KAEL",
  "changelog.subtitle":
    "Від старого сайту до v1.7 — усі помітні зміни без маркетингового шуму.",
  "changelog.close": "Закрити changelog",
  "changelog.closeBackdrop": "Закрити таблицю змін",
  "changelog.open": "Що нового",
  "changelog.openHint": "Таблиця змін KAEL",
  "changelog.versionColumn": "Версія",
  "changelog.changesColumn": "Зміни",
  "changelog.current": "Поточна",
  "changelog.legacy": "Старий сайт",
  "changelog.summary": "{count} релізів · від v1.0 до {version}",
  "changelog.footer":
    "KAEL розвивається ітеративно: кожен реліз робить інтерфейс спокійнішим, а відповіді точнішими.",

  "changelog.v17.tagline": "MCP і безпека",
  "changelog.v17.item0":
    "Будь-які MCP-сервери: OAuth 2.1, bearer-токени й анонімний доступ.",
  "changelog.v17.item1":
    "Інструменти лише для читання виконуються одразу, змінювальні дії потребують підтвердження в чаті.",
  "changelog.v17.item2":
    "OAuth discovery, динамічна реєстрація, PKCE S256 і refresh-токени; токени шифруються на сервері.",
  "changelog.v17.item3":
    "Захист від SSRF, ліміти запитів, журнал аудиту й редагування помилок.",
  "changelog.v17.item4":
    "Публічні сторінки політики конфіденційності, умов і безпеки.",
  "changelog.v17.item5":
    "Посилені заголовки безпеки та безпечні посилання у відповідях.",

  "changelog.v16.tagline": "Теми та розширення",
  "changelog.v16.item0":
    "Дві теми: темна смарагдова й світла зелена. Перемикаються одразу.",
  "changelog.v16.item1":
    "Вибір шрифту інтерфейсу й акцентного шрифту — усі з кирилицею.",
  "changelog.v16.item2":
    "Конектори: реальний статус п'яти провайдерів — OpenRouter, Groq, Ollama, ZeroCat і Gemini — та вибір моделі для кожного.",
  "changelog.v16.item3":
    "Плагіни й навички: живе демо, швидкий старт, changelog після туру та шість навичок у промпті.",
  "changelog.v16.item4":
    "Екран входу Clerk відповідає темі, шрифту й мові, а налаштування отримали розділ «Розширення».",

  "changelog.v15.tagline": "Живий старт",
  "changelog.v15.item0":
    "Жива демонстрація на стартовому екрані: поле саме друкує приклад, слайм реагує.",
  "changelog.v15.item1":
    "Маскот-слайм: реакції на роздуми, друк, помилки й кліки.",
  "changelog.v15.item2":
    "Інтерактивний тур інтерфейсом і повторний запуск із налаштувань.",
  "changelog.v15.item3":
    "Changelog з історією від v1.0 і кнопка «Що нового» в шапці.",
  "changelog.v15.item4":
    "Фінальне полірування Dark Emerald, мобільної шапки й доступності.",

  "changelog.v14.tagline": "Налаштування й персоналізація",
  "changelog.v14.item0":
    "Налаштування в чотирьох розділах: акаунт, клієнт, персоналізація та інше.",
  "changelog.v14.item1":
    "Ім'я профілю через Clerk, стиль відповідей і власні інструкції.",
  "changelog.v14.item2":
    "Звуки інтерфейсу, ембієнт, Enter / Ctrl+Enter і автопрокрутка.",
  "changelog.v14.item3": "Зменшення руху та вимкнення маскота.",
  "changelog.v14.item4":
    "RU / UK / EN і локальна історія на пристрої.",

  "changelog.v13.tagline": "Ядро асистента",
  "changelog.v13.item0":
    "FastAPI-бекенд і три провайдери: OpenRouter, Groq і Ollama.",
  "changelog.v13.item1":
    "Стримінг відповідей та індикатор етапів роботи.",
  "changelog.v13.item2": "Вкладення: PDF, зображення, текст і код.",
  "changelog.v13.item3": "Три режими відповіді та вибір моделі.",
  "changelog.v13.item4": "Артефакти файлів, тарифи й облік токенів.",

  "changelog.v12.tagline": "Dark Emerald",
  "changelog.v12.item0":
    "Палітра Dark Emerald: #0A0A0A, #161616 і #10B981.",
  "changelog.v12.item1":
    "Прибрано неонові градієнти, свічення, шум і зайві ефекти.",
  "changelog.v12.item2":
    "Єдина типографіка, межі та стани компонентів.",
  "changelog.v12.item3": "Адаптивна верстка й доступність із клавіатури.",

  "changelog.v11.tagline": "Акаунти й ролі",
  "changelog.v11.item0": "Вхід через Clerk і особистий профіль.",
  "changelog.v11.item1":
    "Ролі admin / tester / user з різними рівнями доступу.",
  "changelog.v11.item2": "Перевірка JWT на бекенді через JWKS.",
  "changelog.v11.item3": "Підготовка до тарифів і монетизації.",

  "changelog.v10.tagline": "Старий сайт",
  "changelog.v10.item0": "Перший публічний сайт KAEL.",
  "changelog.v10.item1": "Простий чат і базова верстка.",
  "changelog.v10.item2": "Без акаунтів, історії та налаштувань.",

  "landing.demo.eyebrow": "Жива демонстрація",
  "landing.demo.pause": "Пауза",
  "landing.demo.resume": "Продовжити",
  "landing.demo.example": "Приклад {index}",
  "landing.demo.typing": "Друкую запит",
  "landing.demo.thinking": "Думаю",
  "landing.demo.answering": "Відповідаю",
  "landing.demo.done": "Готово",
  "landing.demo.paused": "Пауза",
  "landing.demo.try": "Спробувати запит",
  "landing.demo.note":
    "Це приклад. Відповіді підготовлені заздалегідь і не витрачають токени.",
  "landing.demo.poke": "Торкни слайма",
  "landing.demo.explain.tag": "Розбір",
  "landing.demo.explain.prompt":
    "Поясни, як працює кеш браузера, простими словами.",
  "landing.demo.explain.answer":
    "Браузер зберігає копії файлів, щоб не завантажувати їх заново. Кеш прискорює завантаження, але іноді показує стару версію — тому важливо керувати термінами життя.",
  "landing.demo.code.tag": "Код",
  "landing.demo.code.prompt":
    "Напиши debounce на TypeScript і назви крайні випадки.",
  "landing.demo.code.answer":
    "Debounce відкладає виклик, доки не завершиться серія подій. Не забудьте очистити таймер, зберегти контекст і повернути функцію скасування.",
  "landing.demo.compare.tag": "Вибір",
  "landing.demo.compare.prompt":
    "Порівняй REST і WebSocket для чату в невеликому продукті.",
  "landing.demo.compare.answer":
    "Для чату WebSocket дає миттєві оновлення, а REST простіший для історії та модерації. Почніть із REST і додайте WebSocket, коли затримка стане помітною.",
  "landing.quickStart": "Швидкий старт",

  "landing.badge": "Прямий діалог",
  "landing.title1": "Думай точніше.",
  "landing.title2": "Роби менше шуму.",
  "landing.description":
    "KAEL розкладає складне на зрозумілі частини, пише код без зайвих абстракцій і збирає документи, які не соромно відкрити.",

  "capabilities.title": "Що вміє KAEL",
  "capabilities.code.title": "Код",
  "capabilities.code.description": "Пише, виправляє та пояснює код.",
  "capabilities.docs.title": "Документи",
  "capabilities.docs.description": "Збирає README та інструкції.",
  "capabilities.files.title": "Вкладення",
  "capabilities.files.description": "Читає зображення, PDF і код.",
  "capabilities.noImages": "Не генерує зображення та відео",

  "starter.explain.title": "Розкласти складне",
  "starter.explain.description":
    "Пояснити ідею простими словами і без маркетингу.",
  "starter.explain.prompt":
    "Поясни, як влаштована пам'ять у великих мовних моделях, простими словами. Покажи, де зазвичай помиляються.",
  "starter.code.title": "Спроєктувати код",
  "starter.code.description":
    "Мінімальна реалізація та розбір рішень.",
  "starter.code.prompt":
    "Напиши мінімальну реалізацію черги завдань на TypeScript. Поясни ключові рішення та назви крайні випадки.",
  "starter.compare.title": "Порівняти підходи",
  "starter.compare.description":
    "Побачити компроміси та отримати рекомендацію.",
  "starter.compare.prompt":
    "Порівняй REST і події в реальному часі для невеликого продукту. Покажи компроміси й дай рекомендацію.",
  "starter.document.title": "Зібрати документ",
  "starter.document.description":
    "Отримати готовий файл із чистою структурою.",
  "starter.document.prompt":
    "Збери короткий README для невеликого FastAPI-сервісу з одним ендпоінтом /api/chat.",

  "chat.you": "Ви",
  "chat.responseMissing": "Відповідь не отримано",
  "chat.attachmentOnly": "Проаналізуй вкладення.",
  "chat.newDialog": "Новий діалог",
  "chat.mcp.approvalTitle": "Потрібне підтвердження",
  "chat.mcp.approvalHint":
    "Ці інструменти можуть змінити дані. Перевірте аргументи й виберіть, що дозволити.",
  "chat.mcp.approve": "Дозволити",
  "chat.mcp.auto": "автоматично",
  "chat.mcp.arguments": "Аргументи",
  "chat.mcp.denyAll": "Відхилити все",
  "chat.mcp.selectAll": "Вибрати все",
  "chat.mcp.approveSelected": "Дозволити ({count})",
  "chat.mcp.approvalSending": "Виконуємо…",
  "chat.mcp.trace": "MCP",
  "chat.mcp.trace.ok": "успішно",
  "chat.mcp.trace.error": "помилка",
  "chat.mcp.trace.denied": "відхилено",
  "chat.mcp.approvalExpired":
    "Підтвердження минуло. Надішліть повідомлення ще раз.",
  "chat.mcp.approvalError":
    "Не вдалося продовжити після підтвердження.",

  "error.timeout":
    "Сервер не відповів за {seconds} секунд. Перевірте з'єднання й повторіть запит.",
  "error.connect":
    "Не вдалося підключитися до FastAPI. Перевірте, що сервер запущено на {url}.",
  "error.unknown": "Невідома помилка під час надсилання повідомлення.",
  "error.backendHttp": "Бекенд повернув помилку HTTP {status}.",
  "error.backendEmpty": "Бекенд повернув порожню відповідь.",

  "attachment.kind.pdf": "PDF",
  "attachment.kind.code": "Код",
  "attachment.kind.image": "Зображення",
  "attachment.kind.text": "Текст",
  "attachment.maxFiles": "Можна прикріпити не більше {count} файлів.",
  "attachment.limit":
    "Ліміт — {count} вкладень. Зайві файли не додано.",
  "attachment.unreadable": "Не вдалося прочитати файл.",
  "attachment.totalSize":
    "Загальний розмір вкладень не повинен перевищувати {size}.",
  "attachment.remove": "Видалити вкладення {name}",
  "attachment.hideError": "Приховати повідомлення про помилку",
  "attachment.drop": "Відпустіть файл, щоб прикріпити",
  "attachment.attachFile": "Прикріпити файл",
  "attachment.attachHint": "Прикріпити PDF, текст або код",
  "attachment.addImage": "Додати зображення або скриншот",
  "attachment.addImageHint": "Додати зображення або скриншот",
  "attachment.reading": "Читаю вкладення…",
  "attachment.ready": "{count} з {max} · можна надіслати",
  "attachment.enterToSend": "Enter — надіслати",
  "attachment.enterToSendOff": "Ctrl+Enter — надіслати",
  "attachment.readError": "Не вдалося прочитати файл «{name}».",
  "attachment.imageOpenError": "Не вдалося відкрити зображення.",
  "attachment.imagePrepareError":
    "Браузер не зміг підготувати зображення.",
  "attachment.emptyFile": "Файл «{name}» порожній.",
  "attachment.tooManyChars":
    "Файл «{name}» завеликий: максимум {count} тис. символів.",
  "attachment.tooLarge": "Файл «{name}» більший за {size}.",
  "attachment.unsupported":
    "Формат «{ext}» не підтримується. Прикріпіть PDF, зображення, текст або код.",
  "attachment.noExtension": "без розширення",

  "composer.placeholder": "Запитайте KAEL...",
  "composer.messageAria": "Повідомлення для KAEL",
  "composer.generating": "Генерація відповіді",
  "composer.send": "Надіслати повідомлення",

  "sidebar.history": "Історія",
  "sidebar.newChat": "Новий чат",
  "sidebar.dialogs": "Діалоги",
  "sidebar.empty": "Поки порожньо. Перше питання — внизу.",
  "sidebar.apiOnline": "API онлайн",
  "sidebar.apiOffline": "API офлайн",
  "sidebar.tierAria": "Тариф і ліміти",
  "sidebar.tierAriaName": "Тариф і ліміти: {tier}",
  "sidebar.expand": "Розгорнути бічну панель",
  "sidebar.collapse": "Згорнути бічну панель",
  "sidebar.closeMenu": "Закрити меню",
  "sidebar.wait": "Зачекайте на відповідь KAEL",
  "sidebar.historyAria": "Історія діалогів",
  "sidebar.tokensLeft": "Залишилось токенів: {count}",
  "sidebar.unlimited": "Без обмежень",
  "sidebar.tierTitle": "{tier}: залишилось токенів: {count}",
  "sidebar.tierTitleUnlimited": "{tier}: без обмежень",

  "mode.fast.label": "Швидкий",
  "mode.fast.description": "Миттєва відповідь без довгих міркувань",
  "mode.balanced.label": "Збалансований",
  "mode.balanced.description": "Стандартна відповідь із кроками мислення",
  "mode.deep.label": "Глибокий аналіз",
  "mode.deep.description":
    "Глибокий розбір, архітектура та більший бюджет",
  "mode.aria": "Режим відповіді: {label}",
  "mode.listAria": "Режим відповіді",
  "mode.hint": "Скільки зусиль витрачати на відповідь",

  "model.aria": "Модель: {name}",
  "model.fallback": "Модель",
  "model.selectAria": "Вибір моделі",
  "model.group.cloud": "хмара",
  "model.group.fast": "швидко",
  "model.group.local": "локально",
  "model.group.zerocat": "мультимодель",
  "model.group.gemini": "Google",
  "model.desc.gpt4oMini": "Швидкий універсал для повсякденних завдань",
  "model.desc.gpt4o": "Більше глибини на складних запитах",
  "model.desc.claude": "Сильний у коді та довгому контексті",
  "model.desc.deepseek": "Спокійні міркування без зайвого шуму",
  "model.desc.gptOss120b": "Потужна модель з майже миттєвою відповіддю",
  "model.desc.gptOss20b": "Найшвидша для коротких завдань",
  "model.desc.llama3": "Працює на вашому комп'ютері",
  "model.desc.mistral": "Легка локальна модель для чернеток",
  "model.desc.zerocatGpt": "Флагман GPT через ZeroCat",
  "model.desc.zerocatClaude": "Claude для коду й довгого контексту",
  "model.desc.zerocatDeepseek": "Швидкий і недорогий для повсякденних завдань",
  "model.desc.zerocatGemini": "Швидка мультимодальна модель через ZeroCat",
  "model.desc.geminiFlash": "Швидка модель Google з підтримкою зображень",
  "model.desc.geminiPro": "Глибокі міркування й довгий контекст",

  "thinking.processing": "Обробляю запит...",
  "thinking.done": "Готово",
  "thinking.doneIn": "Готово за {seconds} с",
  "thinking.short": "Збираю коротку відповідь без довгих міркувань...",
  "thinking.deepExtra0":
    "Перевіряю архітектуру та приховані обмеження...",
  "thinking.deepExtra1":
    "Звіряю висновок із задачею й залишаю лише надійне...",
  "thinking.coding.0": "Розбираю задачу, вхідні дані та обмеження...",
  "thinking.coding.1": "Проєктую мінімальне робоче рішення...",
  "thinking.coding.2": "Перевіряю синтаксис і крайні випадки...",
  "thinking.coding.3": "Прибираю зайве й збираю відповідь...",
  "thinking.analysis.0": "Відділяю факти від припущень...",
  "thinking.analysis.1": "Перевіряю аргументи та слабкі місця...",
  "thinking.analysis.2": "Порівнюю альтернативні пояснення...",
  "thinking.analysis.3": "Структурую висновки й прибираю шум...",
  "thinking.document.0": "Визначаю формат і цільову аудиторію...",
  "thinking.document.1": "Збираю структуру документа...",
  "thinking.document.2": "Формулюю зміст розділів...",
  "thinking.document.3": "Перевіряю повноту й єдиний тон...",
  "thinking.social.0": "Зчитую тон і контекст повідомлення...",
  "thinking.social.1": "Відділяю корисне від зайвого...",
  "thinking.social.2": "Формулюю коротку людську відповідь...",
  "thinking.general.0": "Виділяю намір запиту...",
  "thinking.general.1": "Перевіряю контекст і доступні дані...",
  "thinking.general.2": "Збираю практичну відповідь...",
  "thinking.general.3": "Формулюю наступний крок...",

  "tiers.eyebrow": "Тарифи та використання",
  "tiers.title": "Тариф і ліміти",
  "tiers.subtitleDev":
    "Доступ адміністратора. Ліміти вимкнено.",
  "tiers.subtitle": "Ліміти, моделі та поточний рівень доступу.",
  "tiers.close": "Закрити",
  "tiers.closeBackdrop": "Закрити панель тарифів",
  "tiers.devActivated":
    "Секретний тариф «Друг розробника» активовано. Ліміти вимкнено.",
  "tiers.current": "Поточний тариф",
  "tiers.devBadge": "DEV",
  "tiers.unlimited": "Без обмежень",
  "tiers.tokensLeft": "Залишилось токенів: {count}",
  "tiers.tokensProcessed": "Оброблено токенів: {count}",
  "tiers.tokensOf": "{used} з {limit} токенів",
  "tiers.progressAria": "Використання токенів",
  "tiers.percentAria": "{percent} відсотків",
  "tiers.unlimitedNote":
    "Ліміти не застосовуються. Доступ відкритий адміністраторам KAEL.",
  "tiers.limitReset":
    "Ліміт оновиться {date}. Витрати рахуються за відповідями KAEL.",
  "tiers.active": "Активний",
  "tiers.secret": "Секретно",
  "tiers.currentButton": "Поточний тариф",
  "tiers.unavailable": "Поки що недоступно",
  "tiers.unavailableTitle":
    "Оплата й перехід між тарифами з'являться пізніше",
  "tiers.activate": "Активувати",
  "tiers.footer":
    "Тариф визначається роллю акаунта. Оплата й перехід між планами з'являться пізніше.",

  "tier.free.name": "Free Tier",
  "tier.free.price": "0 ₽",
  "tier.free.description":
    "Для знайомства з KAEL та особистих експериментів.",
  "tier.free.feature0": "100 тис. токенів на місяць",
  "tier.free.feature1": "Базові моделі",
  "tier.free.feature2": "Історія діалогів",
  "tier.pro.name": "Pro Creator",
  "tier.pro.price": "990 ₽ / міс",
  "tier.pro.description":
    "Для щоденної роботи, коду та документів.",
  "tier.pro.feature0": "1 млн токенів на місяць",
  "tier.pro.feature1": "Усі моделі та Deep Think",
  "tier.pro.feature2": "Пріоритетна черга",
  "tier.elite.name": "Elite SaaS",
  "tier.elite.price": "2 990 ₽ / міс",
  "tier.elite.description":
    "Для команд і важких навантажень.",
  "tier.elite.feature0": "10 млн токенів на місяць",
  "tier.elite.feature1": "Максимальний контекст",
  "tier.elite.feature2": "Ранній доступ до функцій",
  "tier.dev.name": "Адміністратор",
  "tier.dev.price": "∞",
  "tier.dev.description":
    "Повний доступ для адміністраторів KAEL. Без лімітів і черг.",
  "tier.dev.feature0": "Необмежені токени",
  "tier.dev.feature1": "Усі моделі та Deep Think",
  "tier.dev.feature2": "Прямий доступ до нових функцій",

  "file.aria": "Файл {name}",
  "file.lines": "{count} рядків",
  "file.copyAria": "Скопіювати вміст файлу",
  "file.copy": "Копіювати",
  "file.copied": "Скопійовано",
  "file.unavailable": "Недоступно",
  "file.downloadAria": "Завантажити файл",
  "file.download": "Завантажити",
  "file.expandAria": "Розгорнути файл",
  "file.collapseAria": "Згорнути файл",
  "file.expand": "Розгорнути",
  "file.collapse": "Згорнути",

  "legal.nav": "Правова інформація",
  "legal.privacy": "Політика конфіденційності",
  "legal.terms": "Умови використання",
  "legal.security": "Безпека",
  "legal.back": "Повернутися до KAEL",
  "legal.documentNav": "Правові документи",
  "legal.toc": "Зміст",
  "legal.contactTelegram": "Написати в Telegram",
  "legal.footer":
    "KAEL — незалежний AI-інтерфейс. Документи описують поточну практику сервісу.",

  "settings.eyebrow": "Налаштування",
  "settings.title": "Налаштування KAEL",
  "settings.subtitle": "Акаунт, клієнт і персоналізація асистента.",
  "settings.close": "Закрити налаштування",
  "settings.closeBackdrop": "Закрити налаштування",
  "settings.saved": "Збережено",
  "settings.section.account": "Акаунт",
  "settings.section.accountHint": "Профіль, роль і тариф",
  "settings.section.client": "Клієнт",
  "settings.section.clientHint": "Мова, звук, тема й введення",
  "settings.section.extensions": "Розширення",
  "settings.section.extensionsHint":
    "Конектори, MCP-сервери, плагіни й навички",
  "settings.section.personalization": "Персоналізація",
  "settings.section.personalizationHint": "Ім'я, стиль та інструкції",
  "settings.section.other": "Інше",
  "settings.section.otherHint": "Дані, тур і версія",

  "settings.account.profile": "Профіль",
  "settings.account.nameLabel": "Відображуване ім'я",
  "settings.account.namePlaceholder": "Як до вас звертатися",
  "settings.account.nameHint":
    "Ім'я зберігається в Clerk і показується в інтерфейсі KAEL.",
  "settings.account.saveName": "Зберегти ім'я",
  "settings.account.saving": "Зберігаємо…",
  "settings.account.nameSaved": "Ім'я оновлено",
  "settings.account.nameError": "Не вдалося оновити ім'я",
  "settings.account.email": "Email",
  "settings.account.emailEmpty": "Не вказано",
  "settings.account.role": "Роль",
  "settings.account.plan": "Тариф",
  "settings.account.planHint": "Ліміти й доступні моделі.",
  "settings.account.managePlan": "Тарифи й ліміти",
  "settings.account.signOut": "Вийти з акаунта",
  "settings.account.signOutHint":
    "Локальна історія залишиться на цьому пристрої.",
  "settings.account.deviceNote":
    "Профіль і тариф синхронізуються через Clerk. Історія діалогів і налаштування зберігаються лише на цьому пристрої.",

  "settings.client.language": "Мова інтерфейсу",
  "settings.client.languageHint":
    "Змінює підписи, відповіді KAEL і формат дат.",
  "settings.client.sound": "Звуки інтерфейсу",
  "settings.client.soundHint":
    "Короткі відгуки на натискання, надсилання й помилки.",
  "settings.client.ambient": "Фоновий звук",
  "settings.client.ambientHint": "Тихий ембієнт під час роботи.",
  "settings.client.enterToSend": "Enter надсилає повідомлення",
  "settings.client.enterToSendHint":
    "Якщо вимкнено, Enter переносить рядок, а надсилає Ctrl+Enter.",
  "settings.client.autoScroll": "Прокручувати до відповіді",
  "settings.client.autoScrollHint":
    "Автоматично показувати останнє повідомлення.",
  "settings.client.theme": "Тема оформлення",
  "settings.client.themeHint":
    "Темна смарагдова або світла зелена. Застосовується одразу.",
  "settings.client.theme.dark": "Темна",
  "settings.client.theme.darkHint":
    "Глибокий графіт зі смарагдовим акцентом.",
  "settings.client.theme.light": "Світла",
  "settings.client.theme.lightHint":
    "Теплий світлий фон із зеленим акцентом.",
  "settings.client.interfaceFont": "Шрифт інтерфейсу",
  "settings.client.interfaceFontHint":
    "Впливає на підписи, чат та елементи керування.",
  "settings.client.displayFont": "Акцентний шрифт",
  "settings.client.displayFontHint": "Заголовки, логотип і великі акценти.",
  "settings.client.font.manrope": "Manrope",
  "settings.client.font.inter": "Inter",
  "settings.client.font.onest": "Onest",
  "settings.client.font.unbounded": "Unbounded",
  "settings.client.font.system": "Системний",

  "settings.extensions.connectors": "Конектори провайдерів",
  "settings.extensions.connectorsHint":
    "Ключі зберігаються на сервері. Тут видно, які провайдери відповідають, і можна вибрати модель.",
  "settings.extensions.refresh": "Перевірити",
  "settings.extensions.checking": "Перевіряємо",
  "settings.extensions.connected": "Підключений",
  "settings.extensions.notConfigured": "Не налаштований",
  "settings.extensions.modelFor": "Модель для {provider}",
  "settings.extensions.chooseModel": "Виберіть модель",
  "settings.extensions.connector.openrouterHint":
    "Хмарні моделі через OpenRouter API.",
  "settings.extensions.connector.groqHint": "Швидкі відповіді через Groq API.",
  "settings.extensions.connector.ollamaHint":
    "Локальні моделі через Ollama на вашому сервері.",
  "settings.extensions.connector.zerocatHint":
    "GPT, Claude, DeepSeek і Gemini через ZeroCat API.",
  "settings.extensions.connector.geminiHint":
    "Прямий доступ до моделей Google Gemini.",
  "settings.extensions.plugins": "Плагіни",
  "settings.extensions.pluginsHint":
    "Вмикайте та вимикайте частини інтерфейсу KAEL.",
  "settings.extensions.plugin.liveDemo": "Живе демо",
  "settings.extensions.plugin.liveDemoHint":
    "Показувати демонстрацію на стартовому екрані.",
  "settings.extensions.plugin.quickStart": "Швидкий старт",
  "settings.extensions.plugin.quickStartHint":
    "Показувати готові запити під чатом.",
  "settings.extensions.plugin.changelogAuto": "Changelog після туру",
  "settings.extensions.plugin.changelogAutoHint":
    "Відкривати список змін після першого проходження туру.",
  "settings.extensions.skills": "Навички",
  "settings.extensions.skillsHint":
    "KAEL додає вибрані інструкції до системного промпту.",

  "settings.mcp.title": "MCP-сервери",
  "settings.mcp.hint":
    "Підключайте будь-які MCP-сервери: KAEL сам знайде інструменти, покаже їх у чаті й попросить підтвердження перед змінами.",
  "settings.mcp.add": "Додати сервер",
  "settings.mcp.url": "URL MCP-сервера",
  "settings.mcp.urlPlaceholder": "https://example.com/mcp",
  "settings.mcp.urlHint":
    "Укажіть Streamable HTTP endpoint. Для віддалених серверів потрібен HTTPS.",
  "settings.mcp.name": "Назва",
  "settings.mcp.namePlaceholder": "Наприклад, Notion",
  "settings.mcp.auth": "Авторизація",
  "settings.mcp.auth.auto": "Авто",
  "settings.mcp.auth.none": "Без авторизації",
  "settings.mcp.auth.bearer": "Bearer-токен",
  "settings.mcp.auth.oauth": "OAuth 2.1",
  "settings.mcp.token": "Токен",
  "settings.mcp.tokenHint":
    "Токен зберігається зашифрованим і не повертається до браузера.",
  "settings.mcp.connect": "Підключити",
  "settings.mcp.adding": "Підключаємо…",
  "settings.mcp.urlMustBeHttps":
    "HTTPS обов'язковий. HTTP і localhost дозволені лише в розробці.",
  "settings.mcp.urlRequired":
    "Укажіть повний URL сервера, наприклад https://example.com/mcp.",
  "settings.mcp.oauthReady":
    "Сервер готовий до авторизації. Відкрийте посилання й підтвердьте доступ.",
  "settings.mcp.oauthAfter":
    "Після підтвердження поверніться сюди й натисніть «Перевірити».",
  "settings.mcp.openAuth": "Відкрити авторизацію",
  "settings.mcp.loading": "Завантажуємо MCP-сервери…",
  "settings.mcp.empty": "Поки немає MCP-серверів",
  "settings.mcp.emptyHint":
    "Додайте endpoint сервера. KAEL виконає initialize, отримає список інструментів і підключить їх до чату.",
  "settings.mcp.check": "Перевірити",
  "settings.mcp.reconnect": "Авторизувати",
  "settings.mcp.delete": "Видалити",
  "settings.mcp.deleteYes": "Видалити",
  "settings.mcp.cancel": "Скасувати",
  "settings.mcp.useInChat": "Використовувати в чаті",
  "settings.mcp.allowWrite": "Дозволити зміни без підтвердження",
  "settings.mcp.allowWriteHint":
    "Небезпечно: інструменти зможуть змінювати дані автоматично. Залиште вимкненим, якщо не довіряєте серверу повністю.",
  "settings.mcp.lastError": "Остання помилка: {error}",
  "settings.mcp.securityNote":
    "KAEL перевіряє URL, шифрує токени й вважає результати інструментів недовіреними. Підключайте лише сервери, яким довіряєте.",
  "settings.mcp.noTools": "Інструментів не знайдено. Перевірте сервер.",
  "settings.mcp.toolsTitle": "Інструменти",
  "settings.mcp.readOnly": "читання",
  "settings.mcp.write": "запис",
  "settings.mcp.status.new": "Новий",
  "settings.mcp.status.connected": "Підключено",
  "settings.mcp.status.authRequired": "Потрібна авторизація",
  "settings.mcp.status.error": "Помилка",
  "settings.mcp.error": "Не вдалося виконати дію з MCP-сервером.",

  "settings.personalization.name": "Як до вас звертатися",
  "settings.personalization.namePlaceholder": "Наприклад, Олекс",
  "settings.personalization.nameHint":
    "KAEL використовуватиме це ім'я у відповідях.",
  "settings.personalization.style": "Стиль відповідей",
  "settings.personalization.styleHint":
    "Додатковий тон поверх обраного режиму.",
  "settings.personalization.style.default": "Як завжди",
  "settings.personalization.style.concise": "Стисло",
  "settings.personalization.style.detailed": "Докладно",
  "settings.personalization.style.friendly": "Дружньо",
  "settings.personalization.style.direct": "По суті",
  "settings.personalization.instructions": "Власні інструкції",
  "settings.personalization.instructionsHint":
    "До {max} символів. Додаються до системного промпту KAEL.",
  "settings.personalization.instructionsPlaceholder":
    "Наприклад: відповідай як наставник, наводь приклади на TypeScript і не використовуй емодзі.",
  "settings.personalization.instructionsCounter": "{count} / {max}",
  "settings.personalization.mascot": "Маскот-слайм",
  "settings.personalization.mascotHint":
    "Показувати супутника, який бігає екраном.",
  "settings.personalization.reduceMotion": "Зменшити рух",
  "settings.personalization.reduceMotionHint":
    "Вимикає анімації, біг маскота та плавні переходи.",
  "settings.personalization.privacy":
    "Інструкції надсилаються лише в запиті до моделі й не зберігаються на сервері.",

  "settings.other.data": "Дані на пристрої",
  "settings.other.dataHint":
    "Історія діалогів і налаштування зберігаються в localStorage браузера.",
  "settings.other.stats": "{sessions} діалогів · {messages} повідомлень",
  "settings.other.clearHistory": "Очистити історію",
  "settings.other.clearHistoryHint":
    "Видаляє всі діалоги на цьому пристрої. Налаштування залишаться.",
  "settings.other.clearConfirm":
    "Очистити історію? Цю дію не можна скасувати.",
  "settings.other.clear": "Очистити",
  "settings.other.reset": "Скинути налаштування",
  "settings.other.resetHint":
    "Повернути мову, звук, введення й персоналізацію до типових значень.",
  "settings.other.resetConfirm": "Скинути всі налаштування?",
  "settings.other.resetAction": "Скинути",
  "settings.other.restartTour": "Пройти тур знову",
  "settings.other.restartTourHint":
    "Покаже підказки щодо основних елементів інтерфейсу.",
  "settings.other.about": "Про KAEL",
  "settings.other.version": "Версія {version}",
  "settings.other.aboutText":
    "KAEL — AI-помічник з характером. Next.js на фронтенді, FastAPI на бекенді.",
  "settings.other.legal": "Правові документи",
  "settings.other.cancel": "Скасувати",

  "skill.code.name": "Код",
  "skill.code.description":
    "Пише й править код із прикладами та поясненнями.",
  "skill.explain.name": "Пояснення",
  "skill.explain.description": "Розбирає складне простими кроками.",
  "skill.debug.name": "Налагодження",
  "skill.debug.description":
    "Шукає причину помилки й пропонує перевірене виправлення.",
  "skill.summary.name": "Конспект",
  "skill.summary.description": "Стискає текст до ключових тез.",
  "skill.translate.name": "Переклад",
  "skill.translate.description":
    "Перекладає RU, UK та EN зі збереженням тону.",
  "skill.documents.name": "Документи",
  "skill.documents.description":
    "Структурує бриффи, листи й специфікації.",

  "mascot.poke0": "Ой!",
  "mascot.poke1": "Хіхі, лоскотно!",
  "mascot.poke2": "Бульк!",
  "mascot.poke3": "Ще разок!",

  "units.bytes": "{count} Б",
  "units.kb": "{count} КБ",
  "units.mb": "{count} МБ",
};

const en: Record<TranslationKey, string> = {
  "app.online": "online",
  "app.offline": "offline",

  "header.openMenu": "Open menu",
  "header.chatHistory": "Chat history",
  "header.sfxOff": "Mute interface sounds",
  "header.sfxOn": "Enable interface sounds",
  "header.sfxEnabled": "Interface sounds are on",
  "header.sfxDisabled": "Interface sounds are off",
  "header.ambientOff": "Disable ambient sound",
  "header.ambientOn": "Enable ambient sound",
  "header.ambientEnabled": "Ambient sound is on",
  "header.ambientDisabled": "Ambient sound is off",

  "language.label": "Language",
  "language.select": "Choose language",

  "auth.loading": "Checking your session…",
  "auth.slow": "The server is waking up. This can take up to a minute.",
  "auth.signInTitle": "Sign in to KAEL",
  "auth.signInSubtitle": "Sign in or create an account to continue.",
  "auth.configMissing": "Clerk is not configured",
  "auth.configHint":
    "Add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY to .env.production and rebuild the frontend.",
  "auth.sessionError": "Could not verify your session.",
  "auth.signOut": "Sign out",
  "auth.retry": "Try again",
  "auth.connectError": "Could not connect to the server",
  "auth.role.admin": "Administrator",
  "auth.role.tester": "Tester",
  "auth.role.user": "User",

  "tour.newChat.title": "New chat",
  "tour.newChat.text": "Tap here to start a fresh conversation with KAEL.",
  "tour.mode.title": "Response mode",
  "tour.mode.text":
    "Fast, balanced, or deep. Pick the one that fits the task.",
  "tour.model.title": "Model",
  "tour.model.text":
    "Switch the AI model here. You can compare answers.",
  "tour.attach.title": "Files",
  "tour.attach.text":
    "The paperclip attaches a file or image to your message.",
  "tour.input.title": "Message",
  "tour.input.text": "Type your question here. Enter sends it.",
  "tour.send.title": "Send",
  "tour.send.text": "Or tap the arrow. Let's go!",
  "tour.skip": "Skip",
  "tour.next": "Next",
  "tour.done": "Done",
  "tour.step": "Step {current} of {total}",
  "tour.close": "Close tour",

  "changelog.eyebrow": "Version history",
  "changelog.title": "KAEL changelog",
  "changelog.subtitle":
    "From the old site to v1.7 — every notable change without marketing noise.",
  "changelog.close": "Close changelog",
  "changelog.closeBackdrop": "Close the changelog table",
  "changelog.open": "What's new",
  "changelog.openHint": "KAEL changelog table",
  "changelog.versionColumn": "Version",
  "changelog.changesColumn": "Changes",
  "changelog.current": "Current",
  "changelog.legacy": "Old site",
  "changelog.summary": "{count} releases · from v1.0 to {version}",
  "changelog.footer":
    "KAEL evolves iteratively: each release makes the interface calmer and the answers sharper.",

  "changelog.v17.tagline": "MCP and security",
  "changelog.v17.item0":
    "Any MCP server: OAuth 2.1, bearer tokens, and anonymous access.",
  "changelog.v17.item1":
    "Read-only tools run immediately; changing actions need approval in the chat.",
  "changelog.v17.item2":
    "OAuth discovery, dynamic registration, PKCE S256, and refresh tokens; tokens are encrypted on the server.",
  "changelog.v17.item3":
    "SSRF protection, request limits, an audit log, and error redaction.",
  "changelog.v17.item4":
    "Public privacy policy, terms, and security pages.",
  "changelog.v17.item5":
    "Stronger security headers and safer links in replies.",

  "changelog.v16.tagline": "Themes and extensions",
  "changelog.v16.item0":
    "Two themes: dark emerald and light green. They switch instantly.",
  "changelog.v16.item1":
    "Choose the interface font and the display font — all with Cyrillic support.",
  "changelog.v16.item2":
    "Connectors: real status for five providers — OpenRouter, Groq, Ollama, ZeroCat, and Gemini — plus a model picker per provider.",
  "changelog.v16.item3":
    "Plugins and skills: live demo, quick start, changelog after the tour, and six prompt skills.",
  "changelog.v16.item4":
    "The Clerk sign-in screen follows the theme, font, and language, and settings gained an Extensions section.",

  "changelog.v15.tagline": "Live start",
  "changelog.v15.item0":
    "A live demo on the landing screen: the field types a sample on its own and the slime reacts.",
  "changelog.v15.item1":
    "Slime mascot: reactions to thinking, typing, errors, and clicks.",
  "changelog.v15.item2":
    "An interactive interface tour with a restart from settings.",
  "changelog.v15.item3":
    "A changelog back to v1.0 and a “What's new” button in the header.",
  "changelog.v15.item4":
    "Final polish of Dark Emerald, the mobile header, and accessibility.",

  "changelog.v14.tagline": "Settings and personalization",
  "changelog.v14.item0":
    "Settings in four sections: account, client, personalization, and other.",
  "changelog.v14.item1":
    "Profile name through Clerk, response style, and custom instructions.",
  "changelog.v14.item2":
    "Interface sounds, ambient audio, Enter / Ctrl+Enter, and autoscroll.",
  "changelog.v14.item3": "Reduced motion and a mascot toggle.",
  "changelog.v14.item4":
    "RU / UK / EN and local history on the device.",

  "changelog.v13.tagline": "Assistant core",
  "changelog.v13.item0":
    "FastAPI backend and three providers: OpenRouter, Groq, and Ollama.",
  "changelog.v13.item1":
    "Streaming answers and a progress indicator for each stage.",
  "changelog.v13.item2": "Attachments: PDF, images, text, and code.",
  "changelog.v13.item3": "Three response modes and model selection.",
  "changelog.v13.item4": "File artifacts, tiers, and token accounting.",

  "changelog.v12.tagline": "Dark Emerald",
  "changelog.v12.item0":
    "Dark Emerald palette: #0A0A0A, #161616, and #10B981.",
  "changelog.v12.item1":
    "Removed neon gradients, glows, noise, and unnecessary effects.",
  "changelog.v12.item2":
    "Unified typography, borders, and component states.",
  "changelog.v12.item3":
    "Responsive layout and keyboard accessibility.",

  "changelog.v11.tagline": "Accounts and roles",
  "changelog.v11.item0": "Sign-in through Clerk and a personal profile.",
  "changelog.v11.item1":
    "admin / tester / user roles with different access levels.",
  "changelog.v11.item2": "JWT validation on the backend via JWKS.",
  "changelog.v11.item3": "Preparation for tiers and monetization.",

  "changelog.v10.tagline": "Old site",
  "changelog.v10.item0": "The first public KAEL website.",
  "changelog.v10.item1": "A simple chat and basic layout.",
  "changelog.v10.item2": "No accounts, history, or settings.",

  "landing.demo.eyebrow": "Live demo",
  "landing.demo.pause": "Pause",
  "landing.demo.resume": "Resume",
  "landing.demo.example": "Example {index}",
  "landing.demo.typing": "Typing the request",
  "landing.demo.thinking": "Thinking",
  "landing.demo.answering": "Answering",
  "landing.demo.done": "Done",
  "landing.demo.paused": "Paused",
  "landing.demo.try": "Try this request",
  "landing.demo.note":
    "This is a sample. Answers are pre-written and spend no tokens.",
  "landing.demo.poke": "Poke the slime",
  "landing.demo.explain.tag": "Breakdown",
  "landing.demo.explain.prompt":
    "Explain how browser cache works in plain words.",
  "landing.demo.explain.answer":
    "The browser stores copies of files so it does not download them again. The cache speeds up loading but sometimes shows an old version — so managing lifetimes matters.",
  "landing.demo.code.tag": "Code",
  "landing.demo.code.prompt":
    "Write a debounce in TypeScript and name the edge cases.",
  "landing.demo.code.answer":
    "Debounce postpones the call until a burst of events ends. Clear the timer, preserve the context, and return a cancel function.",
  "landing.demo.compare.tag": "Choice",
  "landing.demo.compare.prompt":
    "Compare REST and WebSocket for chat in a small product.",
  "landing.demo.compare.answer":
    "For chat, WebSocket delivers instant updates, while REST is simpler for history and moderation. Start with REST and add WebSocket when latency becomes noticeable.",
  "landing.quickStart": "Quick start",

  "landing.badge": "Direct dialogue",
  "landing.title1": "Think sharper.",
  "landing.title2": "Make less noise.",
  "landing.description":
    "KAEL breaks complex ideas into clear pieces, writes code without needless abstraction, and produces documents worth opening.",

  "capabilities.title": "What KAEL can do",
  "capabilities.code.title": "Code",
  "capabilities.code.description": "Writes, fixes, and explains code.",
  "capabilities.docs.title": "Documents",
  "capabilities.docs.description": "Builds READMEs and guides.",
  "capabilities.files.title": "Attachments",
  "capabilities.files.description": "Reads images, PDFs, and code.",
  "capabilities.noImages": "Does not generate images or video",

  "starter.explain.title": "Break down complexity",
  "starter.explain.description":
    "Explain an idea in plain words without marketing.",
  "starter.explain.prompt":
    "Explain how memory works in large language models in plain words. Point out where people usually get it wrong.",
  "starter.code.title": "Design code",
  "starter.code.description":
    "Minimal implementation and a walkthrough.",
  "starter.code.prompt":
    "Write a minimal task queue implementation in TypeScript. Explain the key decisions and name the edge cases.",
  "starter.compare.title": "Compare approaches",
  "starter.compare.description":
    "See the trade-offs and get a recommendation.",
  "starter.compare.prompt":
    "Compare REST and real-time events for a small product. Show the trade-offs and give a recommendation.",
  "starter.document.title": "Build a document",
  "starter.document.description":
    "Get a ready file with a clean structure.",
  "starter.document.prompt":
    "Write a short README for a small FastAPI service with a single /api/chat endpoint.",

  "chat.you": "You",
  "chat.responseMissing": "No response received",
  "chat.attachmentOnly": "Analyze the attachments.",
  "chat.newDialog": "New dialogue",
  "chat.mcp.approvalTitle": "Approval needed",
  "chat.mcp.approvalHint":
    "These tools can change data. Review the arguments and choose what to allow.",
  "chat.mcp.approve": "Allow",
  "chat.mcp.auto": "automatic",
  "chat.mcp.arguments": "Arguments",
  "chat.mcp.denyAll": "Deny all",
  "chat.mcp.selectAll": "Select all",
  "chat.mcp.approveSelected": "Allow ({count})",
  "chat.mcp.approvalSending": "Running…",
  "chat.mcp.trace": "MCP",
  "chat.mcp.trace.ok": "ok",
  "chat.mcp.trace.error": "error",
  "chat.mcp.trace.denied": "denied",
  "chat.mcp.approvalExpired":
    "The approval expired. Send the message again.",
  "chat.mcp.approvalError":
    "Could not continue after approval.",

  "error.timeout":
    "The server did not respond within {seconds} seconds. Check the connection and try again.",
  "error.connect":
    "Could not connect to FastAPI. Check that the server is running at {url}.",
  "error.unknown": "Unknown error while sending the message.",
  "error.backendHttp": "The backend returned HTTP {status}.",
  "error.backendEmpty": "The backend returned an empty response.",

  "attachment.kind.pdf": "PDF",
  "attachment.kind.code": "Code",
  "attachment.kind.image": "Image",
  "attachment.kind.text": "Text",
  "attachment.maxFiles": "You can attach up to {count} files.",
  "attachment.limit":
    "The limit is {count} attachments. Extra files were not added.",
  "attachment.unreadable": "Could not read the file.",
  "attachment.totalSize":
    "The total attachment size must not exceed {size}.",
  "attachment.remove": "Remove attachment {name}",
  "attachment.hideError": "Hide the error message",
  "attachment.drop": "Drop the file to attach it",
  "attachment.attachFile": "Attach a file",
  "attachment.attachHint": "Attach a PDF, text, or code",
  "attachment.addImage": "Add an image or screenshot",
  "attachment.addImageHint": "Add an image or screenshot",
  "attachment.reading": "Reading attachments…",
  "attachment.ready": "{count} of {max} · ready to send",
  "attachment.enterToSend": "Enter — send",
  "attachment.enterToSendOff": "Ctrl+Enter — send",
  "attachment.readError": "Could not read the file “{name}”.",
  "attachment.imageOpenError": "Could not open the image.",
  "attachment.imagePrepareError": "The browser could not prepare the image.",
  "attachment.emptyFile": "The file “{name}” is empty.",
  "attachment.tooManyChars":
    "The file “{name}” is too large: {count}K characters maximum.",
  "attachment.tooLarge": "The file “{name}” is larger than {size}.",
  "attachment.unsupported":
    "The “{ext}” format is not supported. Attach a PDF, image, text, or code file.",
  "attachment.noExtension": "no extension",

  "composer.placeholder": "Ask KAEL...",
  "composer.messageAria": "Message for KAEL",
  "composer.generating": "Generating a response",
  "composer.send": "Send message",

  "sidebar.history": "History",
  "sidebar.newChat": "New chat",
  "sidebar.dialogs": "Dialogues",
  "sidebar.empty": "Empty for now. Your first question goes below.",
  "sidebar.apiOnline": "API online",
  "sidebar.apiOffline": "API offline",
  "sidebar.tierAria": "Tier and limits",
  "sidebar.tierAriaName": "Tier and limits: {tier}",
  "sidebar.expand": "Expand sidebar",
  "sidebar.collapse": "Collapse sidebar",
  "sidebar.closeMenu": "Close menu",
  "sidebar.wait": "Wait for KAEL to finish",
  "sidebar.historyAria": "Dialogue history",
  "sidebar.tokensLeft": "Tokens left: {count}",
  "sidebar.unlimited": "Unlimited",
  "sidebar.tierTitle": "{tier}: tokens left: {count}",
  "sidebar.tierTitleUnlimited": "{tier}: unlimited",

  "mode.fast.label": "Fast",
  "mode.fast.description": "Instant answers without long reasoning",
  "mode.balanced.label": "Balanced",
  "mode.balanced.description": "Standard answers with thinking steps",
  "mode.deep.label": "Deep Think",
  "mode.deep.description":
    "Deep analysis, architecture, and a larger budget",
  "mode.aria": "Response mode: {label}",
  "mode.listAria": "Response mode",
  "mode.hint": "How much effort to spend on the answer",

  "model.aria": "Model: {name}",
  "model.fallback": "Model",
  "model.selectAria": "Choose a model",
  "model.group.cloud": "cloud",
  "model.group.fast": "fast",
  "model.group.local": "local",
  "model.group.zerocat": "multi-model",
  "model.group.gemini": "Google",
  "model.desc.gpt4oMini": "Fast all-rounder for everyday tasks",
  "model.desc.gpt4o": "More depth on complex requests",
  "model.desc.claude": "Strong at code and long context",
  "model.desc.deepseek": "Calm reasoning without extra noise",
  "model.desc.gptOss120b": "Powerful model with near-instant answers",
  "model.desc.gptOss20b": "Fastest for short tasks",
  "model.desc.llama3": "Runs on your own computer",
  "model.desc.mistral": "Light local model for drafts",
  "model.desc.zerocatGpt": "GPT flagship through ZeroCat",
  "model.desc.zerocatClaude": "Claude for code and long context",
  "model.desc.zerocatDeepseek": "Fast and inexpensive for everyday tasks",
  "model.desc.zerocatGemini": "Fast multimodal model through ZeroCat",
  "model.desc.geminiFlash": "Fast Google model with image support",
  "model.desc.geminiPro": "Deep reasoning and long context",

  "thinking.processing": "Processing the request...",
  "thinking.done": "Ready",
  "thinking.doneIn": "Ready in {seconds}s",
  "thinking.short": "Assembling a short answer without long reasoning...",
  "thinking.deepExtra0":
    "Checking the architecture and hidden constraints...",
  "thinking.deepExtra1":
    "Verifying the conclusion against the task and keeping only what holds...",
  "thinking.coding.0":
    "Breaking down the task, inputs, and constraints...",
  "thinking.coding.1": "Designing the smallest working solution...",
  "thinking.coding.2": "Checking syntax and edge cases...",
  "thinking.coding.3": "Cutting noise and assembling the answer...",
  "thinking.analysis.0": "Separating facts from assumptions...",
  "thinking.analysis.1": "Testing arguments and weak spots...",
  "thinking.analysis.2": "Comparing alternative explanations...",
  "thinking.analysis.3":
    "Structuring conclusions and removing noise...",
  "thinking.document.0": "Defining the format and audience...",
  "thinking.document.1": "Building the document structure...",
  "thinking.document.2": "Writing the section content...",
  "thinking.document.3": "Checking completeness and tone...",
  "thinking.social.0": "Reading the tone and context...",
  "thinking.social.1": "Separating what matters from noise...",
  "thinking.social.2": "Writing a short, human answer...",
  "thinking.general.0": "Identifying the intent...",
  "thinking.general.1": "Checking context and available data...",
  "thinking.general.2": "Building a practical answer...",
  "thinking.general.3": "Defining the next step...",

  "tiers.eyebrow": "Tiers & usage",
  "tiers.title": "Tiers & limits",
  "tiers.subtitleDev":
    "Administrator access. Limits are off.",
  "tiers.subtitle": "Limits, models, and your current access level.",
  "tiers.close": "Close",
  "tiers.closeBackdrop": "Close tiers panel",
  "tiers.devActivated":
    "The secret “Developer's Friend” tier is active. Limits are off.",
  "tiers.current": "Current tier",
  "tiers.devBadge": "DEV",
  "tiers.unlimited": "Unlimited",
  "tiers.tokensLeft": "{count} tokens left",
  "tiers.tokensProcessed": "{count} tokens processed",
  "tiers.tokensOf": "{used} of {limit} tokens",
  "tiers.progressAria": "Token usage",
  "tiers.percentAria": "{percent} percent",
  "tiers.unlimitedNote":
    "No limits apply. Access is reserved for KAEL administrators.",
  "tiers.limitReset":
    "Limit resets on {date}. Usage is counted from KAEL replies.",
  "tiers.active": "Active",
  "tiers.secret": "Secret",
  "tiers.currentButton": "Current tier",
  "tiers.unavailable": "Not available yet",
  "tiers.unavailableTitle":
    "Payments and tier switching will arrive later",
  "tiers.activate": "Activate",
  "tiers.footer":
    "Your tier is determined by your account role. Payments and plan switching will arrive later.",

  "tier.free.name": "Free Tier",
  "tier.free.price": "0 ₽",
  "tier.free.description":
    "For getting to know KAEL and personal experiments.",
  "tier.free.feature0": "100K tokens per month",
  "tier.free.feature1": "Core models",
  "tier.free.feature2": "Chat history",
  "tier.pro.name": "Pro Creator",
  "tier.pro.price": "990 ₽ / mo",
  "tier.pro.description": "For daily work, code, and documents.",
  "tier.pro.feature0": "1M tokens per month",
  "tier.pro.feature1": "All models and Deep Think",
  "tier.pro.feature2": "Priority queue",
  "tier.elite.name": "Elite SaaS",
  "tier.elite.price": "2,990 ₽ / mo",
  "tier.elite.description": "For teams and heavy workloads.",
  "tier.elite.feature0": "10M tokens per month",
  "tier.elite.feature1": "Maximum context",
  "tier.elite.feature2": "Early access to features",
  "tier.dev.name": "Administrator",
  "tier.dev.price": "∞",
  "tier.dev.description":
    "Full access for KAEL administrators. No limits, no queues.",
  "tier.dev.feature0": "Unlimited tokens",
  "tier.dev.feature1": "All models and Deep Think",
  "tier.dev.feature2": "Direct access to new features",

  "file.aria": "File {name}",
  "file.lines": "{count} lines",
  "file.copyAria": "Copy file contents",
  "file.copy": "Copy",
  "file.copied": "Copied",
  "file.unavailable": "Unavailable",
  "file.downloadAria": "Download file",
  "file.download": "Download",
  "file.expandAria": "Expand file",
  "file.collapseAria": "Collapse file",
  "file.expand": "Expand",
  "file.collapse": "Collapse",

  "legal.nav": "Legal",
  "legal.privacy": "Privacy policy",
  "legal.terms": "Terms of use",
  "legal.security": "Security",
  "legal.back": "Back to KAEL",
  "legal.documentNav": "Legal documents",
  "legal.toc": "Contents",
  "legal.contactTelegram": "Message on Telegram",
  "legal.footer":
    "KAEL is an independent AI interface. These documents describe current service practice.",

  "settings.eyebrow": "Settings",
  "settings.title": "KAEL settings",
  "settings.subtitle": "Account, client, and assistant personalization.",
  "settings.close": "Close settings",
  "settings.closeBackdrop": "Close settings",
  "settings.saved": "Saved",
  "settings.section.account": "Account",
  "settings.section.accountHint": "Profile, role, and plan",
  "settings.section.client": "Client",
  "settings.section.clientHint": "Language, sound, theme, and input",
  "settings.section.extensions": "Extensions",
  "settings.section.extensionsHint":
    "Connectors, MCP servers, plugins, and skills",
  "settings.section.personalization": "Personalization",
  "settings.section.personalizationHint": "Name, style, and instructions",
  "settings.section.other": "Other",
  "settings.section.otherHint": "Data, tour, and version",

  "settings.account.profile": "Profile",
  "settings.account.nameLabel": "Display name",
  "settings.account.namePlaceholder": "What should KAEL call you",
  "settings.account.nameHint":
    "The name is stored in Clerk and shown in the KAEL interface.",
  "settings.account.saveName": "Save name",
  "settings.account.saving": "Saving…",
  "settings.account.nameSaved": "Name updated",
  "settings.account.nameError": "Could not update the name",
  "settings.account.email": "Email",
  "settings.account.emailEmpty": "Not set",
  "settings.account.role": "Role",
  "settings.account.plan": "Plan",
  "settings.account.planHint": "Limits and available models.",
  "settings.account.managePlan": "Plans and limits",
  "settings.account.signOut": "Sign out",
  "settings.account.signOutHint": "Local history stays on this device.",
  "settings.account.deviceNote":
    "Profile and plan sync through Clerk. Chat history and settings live only on this device.",

  "settings.client.language": "Interface language",
  "settings.client.languageHint":
    "Changes labels, KAEL replies, and date formatting.",
  "settings.client.sound": "Interface sounds",
  "settings.client.soundHint":
    "Short feedback for clicks, sends, and errors.",
  "settings.client.ambient": "Ambient sound",
  "settings.client.ambientHint": "Quiet background audio while you work.",
  "settings.client.enterToSend": "Enter sends the message",
  "settings.client.enterToSendHint":
    "When off, Enter adds a new line and Ctrl+Enter sends.",
  "settings.client.autoScroll": "Scroll to the reply",
  "settings.client.autoScrollHint":
    "Automatically reveal the latest message.",
  "settings.client.theme": "Theme",
  "settings.client.themeHint":
    "Dark emerald or light green. Applied instantly.",
  "settings.client.theme.dark": "Dark",
  "settings.client.theme.darkHint": "Deep graphite with an emerald accent.",
  "settings.client.theme.light": "Light",
  "settings.client.theme.lightHint": "Warm light canvas with a green accent.",
  "settings.client.interfaceFont": "Interface font",
  "settings.client.interfaceFontHint":
    "Affects labels, chat, and controls.",
  "settings.client.displayFont": "Display font",
  "settings.client.displayFontHint": "Headings, logo, and large accents.",
  "settings.client.font.manrope": "Manrope",
  "settings.client.font.inter": "Inter",
  "settings.client.font.onest": "Onest",
  "settings.client.font.unbounded": "Unbounded",
  "settings.client.font.system": "System",

  "settings.extensions.connectors": "Provider connectors",
  "settings.extensions.connectorsHint":
    "Keys stay on the server. This shows which providers answer and lets you pick a model.",
  "settings.extensions.refresh": "Check",
  "settings.extensions.checking": "Checking",
  "settings.extensions.connected": "Connected",
  "settings.extensions.notConfigured": "Not configured",
  "settings.extensions.modelFor": "Model for {provider}",
  "settings.extensions.chooseModel": "Choose a model",
  "settings.extensions.connector.openrouterHint":
    "Cloud models through the OpenRouter API.",
  "settings.extensions.connector.groqHint": "Fast replies through the Groq API.",
  "settings.extensions.connector.ollamaHint":
    "Local models through Ollama on your server.",
  "settings.extensions.connector.zerocatHint":
    "GPT, Claude, DeepSeek, and Gemini through the ZeroCat API.",
  "settings.extensions.connector.geminiHint":
    "Direct access to Google Gemini models.",
  "settings.extensions.plugins": "Plugins",
  "settings.extensions.pluginsHint": "Turn parts of the KAEL interface on or off.",
  "settings.extensions.plugin.liveDemo": "Live demo",
  "settings.extensions.plugin.liveDemoHint":
    "Show the animated demo on the start screen.",
  "settings.extensions.plugin.quickStart": "Quick start",
  "settings.extensions.plugin.quickStartHint":
    "Show ready-made prompts under the chat.",
  "settings.extensions.plugin.changelogAuto": "Changelog after the tour",
  "settings.extensions.plugin.changelogAutoHint":
    "Open the changelog after the first tour finishes.",
  "settings.extensions.skills": "Skills",
  "settings.extensions.skillsHint":
    "KAEL appends the selected instructions to the system prompt.",

  "settings.mcp.title": "MCP servers",
  "settings.mcp.hint":
    "Connect any MCP server: KAEL discovers its tools, shows them in the chat, and asks before anything changes.",
  "settings.mcp.add": "Add server",
  "settings.mcp.url": "MCP server URL",
  "settings.mcp.urlPlaceholder": "https://example.com/mcp",
  "settings.mcp.urlHint":
    "Use a Streamable HTTP endpoint. Remote servers must use HTTPS.",
  "settings.mcp.name": "Name",
  "settings.mcp.namePlaceholder": "For example, Notion",
  "settings.mcp.auth": "Authorization",
  "settings.mcp.auth.auto": "Auto",
  "settings.mcp.auth.none": "No authorization",
  "settings.mcp.auth.bearer": "Bearer token",
  "settings.mcp.auth.oauth": "OAuth 2.1",
  "settings.mcp.token": "Token",
  "settings.mcp.tokenHint":
    "The token is stored encrypted and never returned to the browser.",
  "settings.mcp.connect": "Connect",
  "settings.mcp.adding": "Connecting…",
  "settings.mcp.urlMustBeHttps":
    "HTTPS is required. HTTP and localhost are allowed in development only.",
  "settings.mcp.urlRequired":
    "Enter the full server URL, for example https://example.com/mcp.",
  "settings.mcp.oauthReady":
    "The server is ready for authorization. Open the link and approve access.",
  "settings.mcp.oauthAfter":
    "After approving, come back here and press “Check”.",
  "settings.mcp.openAuth": "Open authorization",
  "settings.mcp.loading": "Loading MCP servers…",
  "settings.mcp.empty": "No MCP servers yet",
  "settings.mcp.emptyHint":
    "Add a server endpoint. KAEL runs initialize, fetches the tool list, and wires the tools into the chat.",
  "settings.mcp.check": "Check",
  "settings.mcp.reconnect": "Authorize",
  "settings.mcp.delete": "Delete",
  "settings.mcp.deleteYes": "Delete",
  "settings.mcp.cancel": "Cancel",
  "settings.mcp.useInChat": "Use in chat",
  "settings.mcp.allowWrite": "Allow changes without approval",
  "settings.mcp.allowWriteHint":
    "Dangerous: tools can change data automatically. Keep it off unless you fully trust the server.",
  "settings.mcp.lastError": "Last error: {error}",
  "settings.mcp.securityNote":
    "KAEL validates URLs, encrypts tokens, and treats tool output as untrusted. Connect only servers you trust.",
  "settings.mcp.noTools": "No tools found. Check the server.",
  "settings.mcp.toolsTitle": "Tools",
  "settings.mcp.readOnly": "read",
  "settings.mcp.write": "write",
  "settings.mcp.status.new": "New",
  "settings.mcp.status.connected": "Connected",
  "settings.mcp.status.authRequired": "Authorization required",
  "settings.mcp.status.error": "Error",
  "settings.mcp.error": "Could not complete the MCP server action.",

  "settings.personalization.name": "What should KAEL call you",
  "settings.personalization.namePlaceholder": "For example, Alex",
  "settings.personalization.nameHint":
    "KAEL will use this name in replies.",
  "settings.personalization.style": "Response style",
  "settings.personalization.styleHint":
    "An extra tone on top of the selected mode.",
  "settings.personalization.style.default": "As usual",
  "settings.personalization.style.concise": "Concise",
  "settings.personalization.style.detailed": "Detailed",
  "settings.personalization.style.friendly": "Friendly",
  "settings.personalization.style.direct": "Direct",
  "settings.personalization.instructions": "Custom instructions",
  "settings.personalization.instructionsHint":
    "Up to {max} characters. Appended to KAEL's system prompt.",
  "settings.personalization.instructionsPlaceholder":
    "For example: answer like a mentor, use TypeScript examples, and avoid emoji.",
  "settings.personalization.instructionsCounter": "{count} / {max}",
  "settings.personalization.mascot": "Mascot slime",
  "settings.personalization.mascotHint":
    "Show the companion that roams the screen.",
  "settings.personalization.reduceMotion": "Reduce motion",
  "settings.personalization.reduceMotionHint":
    "Turns off animations, mascot roaming, and smooth transitions.",
  "settings.personalization.privacy":
    "Instructions are sent only with the model request and are not stored on the server.",

  "settings.other.data": "On-device data",
  "settings.other.dataHint":
    "Chat history and settings live in the browser's localStorage.",
  "settings.other.stats": "{sessions} chats · {messages} messages",
  "settings.other.clearHistory": "Clear history",
  "settings.other.clearHistoryHint":
    "Deletes every chat on this device. Settings stay intact.",
  "settings.other.clearConfirm": "Clear history? This cannot be undone.",
  "settings.other.clear": "Clear",
  "settings.other.reset": "Reset settings",
  "settings.other.resetHint":
    "Restore language, sound, input, and personalization defaults.",
  "settings.other.resetConfirm": "Reset all settings?",
  "settings.other.resetAction": "Reset",
  "settings.other.restartTour": "Take the tour again",
  "settings.other.restartTourHint":
    "Shows hints for the main interface elements.",
  "settings.other.about": "About KAEL",
  "settings.other.version": "Version {version}",
  "settings.other.aboutText":
    "KAEL is an AI assistant with character. Next.js on the frontend, FastAPI on the backend.",
  "settings.other.legal": "Legal documents",
  "settings.other.cancel": "Cancel",

  "skill.code.name": "Code",
  "skill.code.description":
    "Writes and edits code with examples and explanations.",
  "skill.explain.name": "Explain",
  "skill.explain.description": "Breaks complex topics into simple steps.",
  "skill.debug.name": "Debug",
  "skill.debug.description":
    "Finds the root cause and proposes a verifiable fix.",
  "skill.summary.name": "Summary",
  "skill.summary.description": "Compresses text into key points.",
  "skill.translate.name": "Translate",
  "skill.translate.description":
    "Translates RU, UK, and EN while keeping the tone.",
  "skill.documents.name": "Documents",
  "skill.documents.description":
    "Structures briefs, letters, and specifications.",

  "mascot.poke0": "Hey!",
  "mascot.poke1": "That tickles!",
  "mascot.poke2": "Blub!",
  "mascot.poke3": "Again!",

  "units.bytes": "{count} B",
  "units.kb": "{count} KB",
  "units.mb": "{count} MB",
};

const DICTIONARIES: Record<Language, Record<TranslationKey, string>> = {
  ru,
  uk,
  en,
};

function interpolate(template: string, vars?: TranslationVars): string {
  if (!vars) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (match, key: string) => {
    const value = vars[key];
    return value === undefined ? match : String(value);
  });
}

export function translate(
  language: Language,
  key: TranslationKey,
  vars?: TranslationVars,
): string {
  return interpolate(DICTIONARIES[language][key], vars);
}

export function createTranslator(language: Language): Translate {
  return (key, vars) => translate(language, key, vars);
}

export const MODE_TRANSLATION_KEYS: Record<
  ResponseMode,
  { label: TranslationKey; description: TranslationKey }
> = {
  fast: { label: "mode.fast.label", description: "mode.fast.description" },
  balanced: {
    label: "mode.balanced.label",
    description: "mode.balanced.description",
  },
  deep: { label: "mode.deep.label", description: "mode.deep.description" },
};

export const MODEL_DESCRIPTION_KEYS: Record<string, TranslationKey> = {
  "openai/gpt-4o-mini": "model.desc.gpt4oMini",
  "openai/gpt-4o": "model.desc.gpt4o",
  "anthropic/claude-3.5-sonnet": "model.desc.claude",
  "deepseek/deepseek-chat": "model.desc.deepseek",
  "groq/openai/gpt-oss-120b": "model.desc.gptOss120b",
  "groq/openai/gpt-oss-20b": "model.desc.gptOss20b",
  "ollama/llama3": "model.desc.llama3",
  "ollama/mistral": "model.desc.mistral",
  "zerocat/gpt-5.6-sol": "model.desc.zerocatGpt",
  "zerocat/claude-sonnet-5": "model.desc.zerocatClaude",
  "zerocat/deepseek-v4.1-flash": "model.desc.zerocatDeepseek",
  "zerocat/gemini-3.8-flash": "model.desc.zerocatGemini",
  "gemini/gemini-3.6-flash": "model.desc.geminiFlash",
  "gemini/gemini-3.1-pro-preview": "model.desc.geminiPro",
};

export const MODEL_GROUP_HINT_KEYS: Record<
  "openrouter" | "groq" | "ollama" | "zerocat" | "gemini",
  TranslationKey
> = {
  openrouter: "model.group.cloud",
  groq: "model.group.fast",
  ollama: "model.group.local",
  zerocat: "model.group.zerocat",
  gemini: "model.group.gemini",
};

export const TIER_TRANSLATION_KEYS: Record<
  TierId,
  {
    name: TranslationKey;
    price: TranslationKey;
    description: TranslationKey;
    features: [TranslationKey, TranslationKey, TranslationKey];
  }
> = {
  free: {
    name: "tier.free.name",
    price: "tier.free.price",
    description: "tier.free.description",
    features: [
      "tier.free.feature0",
      "tier.free.feature1",
      "tier.free.feature2",
    ],
  },
  pro: {
    name: "tier.pro.name",
    price: "tier.pro.price",
    description: "tier.pro.description",
    features: [
      "tier.pro.feature0",
      "tier.pro.feature1",
      "tier.pro.feature2",
    ],
  },
  elite: {
    name: "tier.elite.name",
    price: "tier.elite.price",
    description: "tier.elite.description",
    features: [
      "tier.elite.feature0",
      "tier.elite.feature1",
      "tier.elite.feature2",
    ],
  },
  dev: {
    name: "tier.dev.name",
    price: "tier.dev.price",
    description: "tier.dev.description",
    features: [
      "tier.dev.feature0",
      "tier.dev.feature1",
      "tier.dev.feature2",
    ],
  },
};
