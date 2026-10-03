const { defineConfig } = require('eslint/config');
const expo = require('eslint-config-expo/flat');
module.exports = defineConfig([expo, {
  ignores: ['dist/**', 'android/**', 'ios/**'],
  rules: { '@typescript-eslint/no-explicit-any': 'error' },
}, {
  files: ['src/hooks/use-color-scheme.web.ts'],
  rules: { 'react-hooks/set-state-in-effect': 'off' },
}]);
