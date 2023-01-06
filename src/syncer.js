const {getPlaylist, fetchMusicMetadata} = require("./youtubeApi");
const replaceSpecialCharacters = require('replace-special-characters');
const {normalizeText, normalizeDiacritics, normalizeName, normalizeWhiteSpaces} = require('normalize-text');

async function syncPlaylist(playlistId, title, description) {
    console.log('Fetching playlist from YouTube');
    const playlist = await getPlaylist(playlistId);

    console.log('Fetching music metadata from YouTube');
    const playlistWithMetadata = await fetchMusicMetadata(playlist.items);

    console.log('Clean up video titles');
    for (const v of playlistWithMetadata)
        v.cleanedTitle = normalizeText(normalizeDiacritics(normalizeName(normalizeWhiteSpaces(replaceSpecialCharacters(v.title)))));


    debugger;
}

module.exports = {
    syncPlaylist
};