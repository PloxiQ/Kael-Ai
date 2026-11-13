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
  "header.3dOff": "Отключить 3D-фон",
  "header.3dOn": "Включить 3D-фон",
  "header.quality": "Качество 3D-фона",
  "header.qualityLow": "Низкое",
  "header.qualityHigh": "Высокое",
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

  "landing.badge": "Прямой диалог",
  "landing.title1": "Думай точнее.",
  "landing.title2": "Делай меньше шума.",
  "landing.description":
    "KAEL разбирает сложное на понятные части, пишет код без лишних абстракций и собирает документы, которые не стыдно открыть.",

  "starter.explain.title": "Разложить сложное",
  "starter.explain.description":
    "Объяснить идею простыми словами и без маркетинга.",
  "starter.explain.prompt":
    "Объясни, как устроена память в больших языковых моделях, простыми словами. Покажи, где обычно ошибаются.",
  "starter.code.title": "Спроектировать код",
  "starter.code.description":
    "Получить минимальную реализацию и разбор решений.",
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
  "model.desc.gpt4oMini": "Быстрый универсал для повседневных задач",
  "model.desc.gpt4o": "Больше глубины на сложных запросах",
  "model.desc.claude": "Сильный в коде и длинном контексте",
  "model.desc.deepseek": "Спокойные рассуждения без лишнего шума",
  "model.desc.gptOss120b": "Мощная модель с почти мгновенным ответом",
  "model.desc.gptOss20b": "Самая быстрая для коротких задач",
  "model.desc.llama3": "Работает на вашем компьютере",
  "model.desc.mistral": "Лёгкая локальная модель для черновиков",

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
    "Секретный доступ активен. Публично этот тариф не показывается.",
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
    "Лимиты не применяются. Доступ открыт только для своих.",
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
    "Оплата и переход между стандартными тарифами появятся позже. Текущий уровень доступа сохраняется на этом устройстве.",

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
  "tier.dev.name": "Друг разработчика",
  "tier.dev.price": "∞",
  "tier.dev.description":
    "Секретный доступ для своих. Без лимитов и очередей.",
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
  "header.3dOff": "Вимкнути 3D-фон",
  "header.3dOn": "Увімкнути 3D-фон",
  "header.quality": "Якість 3D-фону",
  "header.qualityLow": "Низька",
  "header.qualityHigh": "Висока",
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

  "landing.badge": "Прямий діалог",
  "landing.title1": "Думай точніше.",
  "landing.title2": "Роби менше шуму.",
  "landing.description":
    "KAEL розкладає складне на зрозумілі частини, пише код без зайвих абстракцій і збирає документи, які не соромно відкрити.",

  "starter.explain.title": "Розкласти складне",
  "starter.explain.description":
    "Пояснити ідею простими словами і без маркетингу.",
  "starter.explain.prompt":
    "Поясни, як влаштована пам'ять у великих мовних моделях, простими словами. Покажи, де зазвичай помиляються.",
  "starter.code.title": "Спроєктувати код",
  "starter.code.description":
    "Отримати мінімальну реалізацію та розбір рішень.",
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
  "model.desc.gpt4oMini": "Швидкий універсал для повсякденних завдань",
  "model.desc.gpt4o": "Більше глибини на складних запитах",
  "model.desc.claude": "Сильний у коді та довгому контексті",
  "model.desc.deepseek": "Спокійні міркування без зайвого шуму",
  "model.desc.gptOss120b": "Потужна модель з майже миттєвою відповіддю",
  "model.desc.gptOss20b": "Найшвидша для коротких завдань",
  "model.desc.llama3": "Працює на вашому комп'ютері",
  "model.desc.mistral": "Легка локальна модель для чернеток",

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
    "Секретний доступ активний. Публічно цей тариф не показується.",
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
    "Ліміти не застосовуються. Доступ відкритий лише для своїх.",
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
    "Оплата й перехід між стандартними тарифами з'являться пізніше. Поточний рівень доступу зберігається на цьому пристрої.",

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
  "tier.dev.name": "Друг розробника",
  "tier.dev.price": "∞",
  "tier.dev.description":
    "Секретний доступ для своїх. Без лімітів і черг.",
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

  "units.bytes": "{count} Б",
  "units.kb": "{count} КБ",
  "units.mb": "{count} МБ",
};

const en: Record<TranslationKey, string> = {
  "app.online": "online",
  "app.offline": "offline",

  "header.openMenu": "Open menu",
  "header.chatHistory": "Chat history",
  "header.3dOff": "Disable 3D background",
  "header.3dOn": "Enable 3D background",
  "header.quality": "3D background quality",
  "header.qualityLow": "Low",
  "header.qualityHigh": "High",
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

  "landing.badge": "Direct dialogue",
  "landing.title1": "Think sharper.",
  "landing.title2": "Make less noise.",
  "landing.description":
    "KAEL breaks complex ideas into clear pieces, writes code without needless abstraction, and produces documents worth opening.",

  "starter.explain.title": "Break down complexity",
  "starter.explain.description":
    "Explain an idea in plain words without marketing.",
  "starter.explain.prompt":
    "Explain how memory works in large language models in plain words. Point out where people usually get it wrong.",
  "starter.code.title": "Design code",
  "starter.code.description":
    "Get a minimal implementation and the reasoning behind it.",
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
  "model.desc.gpt4oMini": "Fast all-rounder for everyday tasks",
  "model.desc.gpt4o": "More depth on complex requests",
  "model.desc.claude": "Strong at code and long context",
  "model.desc.deepseek": "Calm reasoning without extra noise",
  "model.desc.gptOss120b": "Powerful model with near-instant answers",
  "model.desc.gptOss20b": "Fastest for short tasks",
  "model.desc.llama3": "Runs on your own computer",
  "model.desc.mistral": "Light local model for drafts",

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
    "Secret access is active. This tier stays out of public view.",
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
    "No limits apply. Access is reserved for the inner circle.",
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
    "Payments and switching between standard tiers will arrive later. Your current access level is saved on this device.",

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
  "tier.dev.name": "Developer's Friend",
  "tier.dev.price": "∞",
  "tier.dev.description":
    "Secret access for the inner circle. No limits, no queues.",
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
};

export const MODEL_GROUP_HINT_KEYS: Record<
  "openrouter" | "groq" | "ollama",
  TranslationKey
> = {
  openrouter: "model.group.cloud",
  groq: "model.group.fast",
  ollama: "model.group.local",
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
