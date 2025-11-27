/**
 * Общий модуль для микросервисов LOTUS UEMS
 * @module @lotus-uems/common
 */

const {
  t,
  translations,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  isLanguageSupported,
  getLanguage,
} = require("./i18n");

module.exports = {
  // i18n функции
  t,
  translations,
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES,
  isLanguageSupported,
  getLanguage,
};
