const SpotifyWebApi = require('spotify-web-api-node');
const fs = require('fs');
const path = require('path');

const credentialFile = path.resolve(__dirname, '..', 'credentialsSpotify.json');
const tokenFile = path.resolve(__dirname, '..', 'tokenSpotify.json');

const token = require(tokenFile);

let {access_token, refresh_token} = token;

const spotifyApi = new SpotifyWebApi(require(credentialFile));

spotifyApi.setAccessToken(access_token);
spotifyApi.setRefreshToken(refresh_token);

const refreshToken = async () => {
    let expires_in;
    ({body: {access_token, expires_in}} = await spotifyApi.refreshAccessToken());

    fs.writeFileSync(tokenFile, JSON.stringify({access_token, refresh_token}, null, 4));

    spotifyApi.setAccessToken(access_token);
    spotifyApi.setRefreshToken(refresh_token);

    setTimeout(() => refreshToken(), 1_000 * (expires_in - 60)).unref();
};

refreshToken().catch(console.error);

module.exports = spotifyApi;