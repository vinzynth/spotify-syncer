const inquirer = require('inquirer');
const {getPlaylistDetails} = require("./src/youtubeApi");
const {syncPlaylist} = require("./src/syncer");

(async () => {
    const {url} = await inquirer.prompt([{
        type: 'input', name: 'url', message: 'Which YouTube playlist to import?', default: 'https://www.youtube.com/watch?v=FsSBXr5sOcc&list=PL11SmZAO8BYZh7QQYncE4zQrTXkt3XAt1&index=93'
    }]);

    const startIdx = url.indexOf('list=') + 5;
    const endIdx = url.indexOf('&', startIdx);
    const id = url.substring(startIdx, endIdx < 0 ? url.length : endIdx);

    if(!id){
        console.log('No playlist ID found');
        return;
    }

    const pl = await getPlaylistDetails(id);

    const {title, description} = await inquirer.prompt([
        {type: 'input', name: 'title', message: 'Spotify playlist title:', default: pl.title + ' by ' + pl.channelTitle},
        {type: 'input', name: 'description', message: 'Spotify playlist description:', default: `Created from https://www.youtube.com/playlist?list=${id} with https://github.com/vinzynth/spotify-syncer`},
    ]);

    await syncPlaylist(id, title, description);
})()