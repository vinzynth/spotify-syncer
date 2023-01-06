const inquirer = require('inquirer');

(async () => {
   const prompts = [
       {type: 'input', name: 'ytplaylist', message: 'Which YouTube playlist to import?'}
   ];

   const result = await inquirer.prompt(prompts);

   // TODO: call apis
   console.table(result);
})()