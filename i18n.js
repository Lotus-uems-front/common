/**
 * Модуль интернационализации для микросервисов LOTUS UEMS
 * Поддерживает переводы уведомлений на несколько языков
 * @module i18n
 */

/**
 * Объект с переводами для всех поддерживаемых языков
 * @type {Object.<string, Object.<string, string>>}
 */
const translations = {
  en: {
    // Приглашение на закупку - email
    invite_email_subject: "Invitation to procurement on LOTUS UEMS platform",
    invite_email_title: 'To the representative of "{companyName}"',
    invite_email_body:
      'Company "{hostCompanyName}" invites you to the procurement "{tradeName}" ({lotusId}) on the LOTUS UEMS platform',
    invite_email_link_text: "To view the invitation, follow the link:",

    // Приглашение на закупку - in-app уведомление
    invite_notification_received:
      'Your company "{invitedCompanyName}" received an invitation to procurement "{tradeName}" ({lotusId}) from company "{hostCompanyName}".',
  },

  ru: {
    // Приглашение на закупку - email
    invite_email_subject: "Приглашение на закупку на платформе LOTUS UEMS",
    invite_email_title: 'Представителю компании "{companyName}"',
    invite_email_body:
      'Компания "{hostCompanyName}" приглашает Вас на закупку "{tradeName}" ({lotusId}) на платформе LOTUS UEMS',
    invite_email_link_text: "Для просмотра приглашения перейдите по ссылке:",

    // Приглашение на закупку - in-app уведомление
    invite_notification_received:
      'Ваша компания "{invitedCompanyName}" получила приглашение на закупку "{tradeName}" ({lotusId}) от компании "{hostCompanyName}".',
  },
};

/**
 * Язык по умолчанию
 * @type {string}
 */
const DEFAULT_LANGUAGE = "en";

/**
 * Список поддерживаемых языков
 * @type {string[]}
 */
const SUPPORTED_LANGUAGES = Object.keys(translations);

/**
 * Переводит ключ с подстановкой переменных
 * @param {string} key - Ключ перевода
 * @param {string} [language] - Код языка (по умолчанию 'en')
 * @param {Object} [variables] - Переменные для подстановки в шаблон
 * @returns {string} Переведённая строка с подставленными переменными
 */
function t(key, language = DEFAULT_LANGUAGE, variables = {}) {
  // Если язык не поддерживается, используем язык по умолчанию
  const lang = SUPPORTED_LANGUAGES.includes(language)
    ? language
    : DEFAULT_LANGUAGE;

  const languageTranslations = translations[lang];

  // Получаем перевод или fallback на дефолтный язык, или возвращаем ключ
  let text =
    languageTranslations[key] || translations[DEFAULT_LANGUAGE][key] || key;

  // Подстановка переменных вида {variableName}
  for (const [variableName, value] of Object.entries(variables)) {
    text = text.replace(new RegExp(`\\{${variableName}\\}`, "g"), value);
  }

  return text;
}

/**
 * Проверяет, поддерживается ли указанный язык
 * @param {string} language - Код языка для проверки
 * @returns {boolean} true если язык поддерживается
 */
function isLanguageSupported(language) {
  return SUPPORTED_LANGUAGES.includes(language);
}

/**
 * Возвращает язык для использования (переданный или дефолтный)
 * @param {string} [language] - Код языка
 * @returns {string} Поддерживаемый код языка
 */
function getLanguage(language) {
  return isLanguageSupported(language) ? language : DEFAULT_LANGUAGE;
}

module.exports = {
  t,
  translations,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  isLanguageSupported,
  getLanguage,
};
