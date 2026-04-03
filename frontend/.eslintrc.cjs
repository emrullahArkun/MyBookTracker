module.exports = {
  root: true,
  env: { browser: true, es2020: true, node: true },
  globals: {
    global: 'readonly',
  },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs', 'coverage', 'test-results'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: 'detect' } },
  plugins: ['react-refresh'],
  overrides: [
    {
      files: ['**/*.{ts,tsx}'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      plugins: ['@typescript-eslint'],
      extends: ['plugin:@typescript-eslint/recommended'],
      rules: {
        'no-undef': 'off',
        'no-unused-vars': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        }],
      },
    },
    {
      files: ['src/shared/**/*.{js,jsx,ts,tsx}'],
      rules: {
        'no-restricted-imports': ['error', {
          patterns: [
            {
              group: ['../../app', '../../app/*'],
              message: 'shared must not depend on app code.',
            },
            {
              group: ['../../features', '../../features/*'],
              message: 'shared must not depend on feature code.',
            },
          ],
        }],
      },
    },
    {
      files: ['src/features/**/*.{js,jsx,ts,tsx}'],
      rules: {
        'no-restricted-imports': ['error', {
          patterns: [
            {
              group: [
                '../../auth/pages',
                '../../auth/pages/*',
                '../../discovery/pages',
                '../../discovery/pages/*',
                '../../goals/pages',
                '../../goals/pages/*',
                '../../library/pages',
                '../../library/pages/*',
                '../../reading-session/pages',
                '../../reading-session/pages/*',
                '../../search/pages',
                '../../search/pages/*',
                '../../stats/pages',
                '../../stats/pages/*',
              ],
              message: 'Do not import pages from another feature.',
            },
            {
              group: [
                '../../auth/ui',
                '../../auth/ui/*',
                '../../discovery/ui',
                '../../discovery/ui/*',
                '../../goals/ui',
                '../../goals/ui/*',
                '../../library/ui',
                '../../library/ui/*',
                '../../reading-session/ui',
                '../../reading-session/ui/*',
                '../../search/ui',
                '../../search/ui/*',
                '../../stats/ui',
                '../../stats/ui/*',
              ],
              message: 'Do not import UI from another feature.',
            },
            {
              group: [
                '../../auth/api',
                '../../auth/api/*',
                '../../discovery/api',
                '../../discovery/api/*',
                '../../goals/api',
                '../../goals/api/*',
                '../../library/api',
                '../../library/api/*',
                '../../reading-session/api',
                '../../reading-session/api/*',
                '../../search/api',
                '../../search/api/*',
                '../../stats/api',
                '../../stats/api/*',
              ],
              message: 'Do not import API internals from another feature. Use the barrel export instead.',
            },
            {
              group: [
                '../../auth/model',
                '../../auth/model/*',
                '../../discovery/model',
                '../../discovery/model/*',
                '../../goals/model',
                '../../goals/model/*',
                '../../library/model',
                '../../library/model/*',
                '../../reading-session/model',
                '../../reading-session/model/*',
                '../../search/model',
                '../../search/model/*',
                '../../stats/model',
                '../../stats/model/*',
              ],
              message: 'Do not import model internals from another feature. Use the barrel export instead.',
            },
          ],
        }],
      },
    },
    {
      files: ['src/features/**/*.test.{js,jsx,ts,tsx}', 'src/features/**/*.spec.{js,jsx,ts,tsx}'],
      rules: {
        'no-restricted-imports': 'off',
      },
    },
  ],
  rules: {
    'react/jsx-no-target-blank': 'off',
    'react-refresh/only-export-components': 'off',
    'react/prop-types': 'off',
    'no-unused-vars': 'warn',
    'no-useless-catch': 'off',
    'react/display-name': 'off',
    'react-hooks/exhaustive-deps': 'warn',
    'react-hooks/set-state-in-effect': 'off',
    'no-undef': 'error',
  },
}
