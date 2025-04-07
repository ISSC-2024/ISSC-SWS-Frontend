import { exec } from 'child_process'
import chalk from 'chalk'
const generateLintCommand = (lintPathList: Array<string>): string => {
    let command = ''
    for (let index = 0; index < lintPathList.length; index++) {
        const lintPath = lintPathList[index]
        if (index !== lintPathList.length - 1) {
            command += `eslint ${lintPath} --fix -c eslint.config.js &&`
        } else {
            command += `eslint ${lintPath} --fix -c eslint.config.js`
        }
    }
    return command
}
const command = generateLintCommand(['src/*.{vue,ts}', 'src/*/**/*.{vue,ts}'])

exec(command, (error, stdout: string, stderr: string) => {
    if (error && error.code !== 2) {
        console.log(chalk.red(stdout))
        console.log(chalk.red(stderr))
        process.exit(error.code)
    }
    console.log(stdout)
    console.log(stderr)
})