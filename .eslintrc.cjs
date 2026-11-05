module.exports = {
    root: true,
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    extends: 'eslint:recommended',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    plugins: ['html'],
    rules: {
        'no-var': 'warn',
        'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
    ignorePatterns: ['dist/', 'backups/', 'node_modules/'],
};
