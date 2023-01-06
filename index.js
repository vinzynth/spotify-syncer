const inquirer = require('inquirer');
const {getPlaylist, getPlaylistDetails} = require("./src/youtubeApi");

(async () => {
    const {url} = await inquirer.prompt([{
        type: 'input', name: 'url', message: 'Which YouTube playlist to import?'
    }]);

    const startIdx = url.indexOf('list=') + 5;
    const endIdx = url.indexOf('&', startIdx);
    const id = url.substring(startIdx, endIdx < 0 ? url.length : endIdx);

    const pl = await getPlaylistDetails(id);

    console.table(pl);
    debugger;
    // TODO: call apis
})()