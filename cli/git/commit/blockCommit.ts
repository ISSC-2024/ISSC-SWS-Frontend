import chalk from 'chalk'
console.log(chalk.red('git commit会被拦截，请使用npm run commit提交代码'))
process.exit(1)