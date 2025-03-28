module.exports = {
  root: true,
  env: {
    node: true
  },
  'extends': [
    'plugin:vue/vue3-recommended',
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/typescript/recommended'
  ],
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'vue/script-setup-uses-vars': 'error', // 确保 script setup 中的变量被正确识别
    'no-undef': 'off', // 关闭 no-undef 规则
    '@typescript-eslint/no-unused-vars': 'off', // 关闭 TypeScript 未使用变量规则
    'vue/no-unused-vars': 'off', // 关闭 Vue 未使用变量规则
  }
}
