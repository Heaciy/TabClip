import vueParser from 'vue-eslint-parser';
import js from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import vue from 'eslint-plugin-vue';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default [
    {
        ignores: ['.idea/', 'public/', 'dist/', 'node_modules/', 'src/components/ui/'],
    },

    js.configs.recommended,

    ...vue.configs['flat/recommended'],

    prettierRecommended,

    {
        files: ['**/*.vue'],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tseslint.parser,
                sourceType: 'module',
                ecmaVersion: 'latest',
                extraFileExtensions: ['.vue'],
                project: ['./tsconfig.json', './tsconfig.app.json'],
            },
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin,
        },
    },

    {
        files: ['**/*.ts', '**/*.tsx'],
        languageOptions: {
            parser: tseslint.parser,
            parserOptions: {
                sourceType: 'module',
                ecmaVersion: 'latest',
                project: ['./tsconfig.json', './tsconfig.app.json', './tsconfig.node.json'],
            },
        },
        plugins: {
            '@typescript-eslint': tseslint.plugin,
        },
    },

    {
        files: ['**/*.js', '**/*.ts', '**/*.vue'],
        languageOptions: {
            sourceType: 'module',
            ecmaVersion: 'latest',
            globals: {
                chrome: 'readonly',
                ...globals.browser,
                ...globals.node,
            },
        },
        plugins: {
            import: importPlugin,
            'simple-import-sort': simpleImportSort,
        },
        rules: {
            'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],

            'import/order': 'off',

            'simple-import-sort/imports': [
                'error',
                {
                    groups: [['^\\u0000'], ['^vue', '^@?\\w'], ['^(@|\\.)(/.*|$)'], ['^.+\\.?(css|scss|less)$']],
                },
            ],
            'simple-import-sort/exports': 'error',

            'vue/multi-word-component-names': 'off',
        },
    },
];
