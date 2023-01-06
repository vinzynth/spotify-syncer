const {google} = require('googleapis');

const fs = require('fs');
const path = require('path');

const credentialFile = path.resolve(__dirname, '..', 'credentialsYT.json');
const tokenFile = path.resolve(__dirname, '..', 'tokenYT.json');

if(!fs.existsSync(tokenFile))
    fs.writeFileSync(tokenFile, '{}');

const {client_secret, client_id, redirect_uris} = require(credentialFile).installed;
const token = require(tokenFile);
let {access_token, refresh_token} = token;

let client;

const oAuth2Client = () => {
    if(client)
        return client;

    const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
    oAuth2Client.setCredentials(token);
    oAuth2Client.on('tokens', (tokens) => {
        if (tokens.refresh_token)
            token.refresh_token = tokens.refresh_token;
        token.access_token = tokens.access_token;

        fs.writeFileSync(tokenFile, JSON.stringify(token, null, 4));

        access_token = tokens.access_token;
        refresh_token = tokens.refresh_token;
    });
    client = oAuth2Client;
    return oAuth2Client;
}

google.options({auth: oAuth2Client});

const yt = google.youtube("v3");

async function* scroll(f, o = {}) {
    const opts = {maxResults: 50, part: 'contentDetails,snippet,status,id', ...o};
    const {data: {items, nextPageToken}} = await f.bind(yt)(opts);

    for (const i of items){
        const r = {...i, ...i.snippet, ...i.contentDetails};
        delete r.snippet;
        delete r.contentDetails;
        yield r;
    }

    if (nextPageToken)
        for await(const i of await scroll(f, {...opts, pageToken: nextPageToken}))
            yield i;
}

async function list(f, opts) {
    const ff = f.list ? f.list : f;
    const res = [];
    for await (const i of scroll(ff, opts))
        res.push(i);
    return res;
}

async function get(f, opts){
    return (await list(f, opts))?.[0];
}

async function getPlaylist(playlistId) {
    const p = await get(yt.playlists, {id: playlistId});
    const items = await list(yt.playlistItems, {playlistId});
    return {...p, items};
}

async function getVideoDetails(ids = []) {
    const items = await list(yt.videos, {
        id: ids.join(','),
        part: 'contentDetails,id,localizations,player,snippet,statistics,status,topicDetails'
    });
    return {items};
}

module.exports = {
    getPlaylist,
    getVideoDetails
};