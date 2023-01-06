const {google} = require('googleapis');
const Semaphore = require('async-mutex').Semaphore;
const fs = require('fs');
const path = require('path');

const credentialFile = path.resolve(__dirname, '..', 'credentialsYT.json');
const tokenFile = path.resolve(__dirname, '..', 'tokenYT.json');

if (!fs.existsSync(tokenFile))
    fs.writeFileSync(tokenFile, '{}');

const {client_secret, client_id, redirect_uris} = require(credentialFile).installed;
const token = require(tokenFile);
const axios = require("axios");
let {access_token, refresh_token} = token;

let client;

const oAuth2Client = () => {
    if (client)
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

google.options({auth: oAuth2Client()});

const yt = google.youtube("v3");

async function* scroll(f, o = {}) {
    const opts = {maxResults: 50, part: 'contentDetails,snippet,status,id', ...o};
    const {data: {items, nextPageToken}} = await f.bind(yt)(opts);

    for (const i of items) {
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

async function get(f, opts) {
    return (await list(f, opts))?.[0];
}

async function getPlaylist(playlistId) {
    const p = await get(yt.playlists, {id: playlistId});
    const items = await list(yt.playlistItems, {playlistId});
    return {...p, items};
}

async function getPlaylistDetails(playlistId) {
    return get(yt.playlists, {id: playlistId});
}

async function getVideoDetails(ids = []) {
    const items = await list(yt.videos, {
        id: ids.join(','),
        part: 'contentDetails,id,localizations,player,snippet,statistics,status,topicDetails'
    });
    return {items};
}

// Fetches the music metadata from the YouTube page. Apparently the API does not provide this information. Should be
// replaced tho as soon as possible.
async function fetchMusicMetadata(videos = []) {
    const semaphore = new Semaphore(20);

    const promises = [];
    for (const v of videos) {
        const {videoId} = v;
        v.musicMetadata = [];

        promises.push(semaphore.runExclusive(async () => {
            return axios.get('https://www.youtube.com/watch?v=' + videoId, {timeout: 10_000}).then(res => {
                const startKey = 'videoDescriptionMusicSectionRenderer';
                const endKey = 'premiumUpsellLink';
                const idxStart = res?.data?.indexOf(startKey) || -1;
                const idxEnd = res?.data?.lastIndexOf(endKey) || -1;
                if (idxStart < 0 || idxEnd < 0)
                    return v;

                const scope = '' + res?.data?.substring(idxStart + startKey.length + 2, idxEnd - 2) + '}';
                let json = [];
                try {
                    json = JSON.parse(scope);
                } catch (e) {
                    return v;
                }

                const musicMetadata = json.carouselLockups[0].carouselLockupRenderer.infoRows;
                let counter = 0;
                for (const md of musicMetadata) {
                    const content = md?.infoRowRenderer?.defaultMetadata;

                    if (content?.simpleText)
                        v.musicMetadata.push(content.simpleText);
                    if (content?.runs?.[0]?.text)
                        v.musicMetadata.push(content.runs[0].text);

                    if (counter++ > 2)
                        break;
                }
                return v;
            }).catch(e => {
                console.error('Error fetching https://www.youtube.com/watch?v=' + videoId);
                console.error(e);
            });
        }));
    }

    return await Promise.all(promises);
}

module.exports = {
    oAuth2Client,
    getPlaylist,
    getPlaylistDetails,
    fetchMusicMetadata
};