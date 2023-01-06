const {getPlaylist, fetchMusicMetadata} = require("./youtubeApi");
const replaceSpecialCharacters = require('replace-special-characters');
const {normalizeText, normalizeDiacritics, normalizeName, normalizeWhiteSpaces} = require('normalize-text');
const spotifyApi = require("./spotifyApi");

async function syncPlaylist(playlistId, title, description) {
    console.log('Fetching playlist from YouTube');
    const playlist = await getPlaylist(playlistId);

    console.log('Fetching music metadata from YouTube');
    const playlistWithMetadata = await fetchMusicMetadata(playlist.items);

    console.log('Clean up video titles');
    for (const v of playlistWithMetadata)
        v.cleanedTitle = normalizeText(normalizeDiacritics(normalizeName(normalizeWhiteSpaces(replaceSpecialCharacters(v.title)))));

    console.log('Finding best candidate for individual video');
    const matches = {};
    for (const v of playlistWithMetadata) {
        const t = v.title.toLowerCase();
        if (t === 'private video' || t === 'deleted video')
            continue;

        const s = t + ' ' + v.musicMetadata.reduce((a, b) => a + ' ' + b, '');
        const search = s.toLowerCase()
            .replace(/[\u0300-\u036f]/g, "")
            // .replace(/\(.*\)/gi, '')
            .replace(/\[.*]/gi, '')
            .replace(/\|.*/gi, '')
            .replace(/-/gi, ' ')
            .replace('feat', '')
            .replace('psy trance', '')
            .replace('rmx', '')
            .replace('remix', '')
            .replace(' ft. ', ' ')
            .replace(' vs. ', ' ')
            .replace(/[^0-9a-zäöëüØß\s\w\u0430-\u044fÆ]/gi, ' ')
            .replace('official music', '')
            .replace('official lyric ', '')
            .replace('official', '')
            .replace(/lyrics?/g, '')
            .replace(/\sx\s/g, ' ')
            .replace('video', '')
            .replace('free', '')
            .replace('download', '')
            .replace(' mix ', '')
            .replace('original', '')
            .replace('release', '')
            .replace('extended', '')
            .replace('audio', '')
            .replace(' drum ', ' ')
            .replace(' bass ', ' ')
            .replace(/\s+/g, ' ');

        const initWords = [...new Set(search.split(' ').filter(i => i))];
        const sts = [];

        for (let i = 0; i < initWords.length; i++)
            sts.push(initWords.slice(i));
        for (let i = 0; i < initWords.length - 1; i++)
            sts.push(initWords.slice(0, initWords.length - i - 1));

        sts.sort((a, b) => b.length - a.length);

        let items = [];

        let exMatch = true;
        for (const sta of sts) {
            const st = sta.join(' ');

            const {body: {tracks: {items: fi}}} = await spotifyApi.searchTracks(st);

            if (!fi?.length) {
                exMatch = false;
                continue;
            }

            items = fi;
            break;
        }

        let added = false;
        outer: for (const item of items) {
            for (const {name} of item.artists.reverse()) {
                if (v.musicMetadata || t.toLowerCase().includes(name.toLowerCase())) {
                    matches[item.uri] = item;
                    added = true;
                    console.log('Add', String(Object.keys(matches).length).padEnd(5), item.name.padEnd(70), t);
                    break outer;
                }
            }
        }

        if (!added) {
            if (v.musicMetadata.length)
                console.log('Miss w. MD', t.padEnd(70), search);
            else
                console.log('Miss'.padEnd(10), t.padEnd(70), search);
        }
    }

    const list = Object.keys(matches);
    console.log('Matched', list.length, 'out of', playlist.items.length, ((100 * list.length) / playlist.items.length).toFixed(2) + '%');

    const {body} = await spotifyApi.createPlaylist(title, {description, "public": true});
    const spotifyPlaylistId = body.id;

    for(let i = 0; i < list.length ; i += 100){
        const tracks = list.slice(i, i + 100);
        if(tracks?.length)
            await spotifyApi.addTracksToPlaylist(spotifyPlaylistId, tracks);
    }

    console.log('Created Spotify playlist', body.external_urls.spotify);
}

module.exports = {
    syncPlaylist
};