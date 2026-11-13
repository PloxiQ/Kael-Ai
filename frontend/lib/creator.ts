export const CREATOR_ANSWER =
  "Я сделан командой Kael, в основном от @SAM0SOB0Y, ихний тг канал с обновлением меня: t.me/SAM0S0B0Y";

export const CREATOR_HANDLE = "@SAM0SOB0Y";

export const CREATOR_CHANNEL = "https://t.me/SAM0S0B0Y";

const CREATOR_PATTERNS: RegExp[] = [
  /кто (тебя|вас) (сделал|создал|разработал|придумал|написал)/i,
  /кто (твой|ваш) (создатель|разработчик|автор|владелец)/i,
  /кем (ты|вы) (сделан|создан|разработан)/i,
  /кто (создал|сделал|разработал|придумал) (kael|кэл|кел)/i,
  /кто (разработчик|создатель|автор|владелец) (kael|кэл|кел)/i,
  /кто стоит за (kael|кэл|кел|тобой)/i,
  /откуда (ты|kael|кэл|кел) (взялся|появился)/i,
  /who (made|created|built|developed|designed) you/i,
  /who is your (creator|developer|author|owner)/i,
  /who (owns|runs|made|created|built) kael/i,
];

export function isCreatorQuestion(message: string): boolean {
  const normalized = message
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/\s+/g, " ")
    .trim();

  if (!normalized) {
    return false;
  }

  return CREATOR_PATTERNS.some((pattern) => pattern.test(normalized));
}
