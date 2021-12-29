module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint', 'eslint-plugin-tsdoc'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:import/errors',
        'plugin:import/warnings',
        'plugin:import/typescript',
    ],
    rules: {
        '@typescript-eslint/no-console': 'off',
        '@typescript-eslint/no-unused-expression': 'off',
        "import/no-unresolved": "off",
        'import/no-duplicates': 'error',
        'import/order': [
            'error',
            {
                alphabetize: {
                    order: 'asc',
                },
                'newlines-between': 'always',
                pathGroups: [
                    {
                        group: 'external',
                        pattern: 'src',
                        position: 'after',
                    },
                    {
                        group: 'external',
                        pattern: 'src/**',
                        position: 'after',
                    },
                ],
                pathGroupsExcludedImportTypes: ['builtin'],
            },
        ],
        'sort-imports': [
            'error',
            {
                ignoreDeclarationSort: true,
            },
        ],
    },
};
