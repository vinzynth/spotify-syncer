const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const fs = require('fs');
const path = require('path');
const open = require('open');
const {oAuth2Client} = require("./youtubeApi");

const PORT = 80;
const SPOTIFY_API_SCOPES = [
    'ugc-image-upload',
    'user-read-playback-state',
    'user-modify-playback-state',
    'user-read-currently-playing',
    'streaming',
    'app-remote-control',
    'user-read-email',
    'user-read-private',
    'playlist-read-collaborative',
    'playlist-modify-public',
    'playlist-read-private',
    'playlist-modify-private',
    'user-library-modify',
    'user-library-read',
    'user-top-read',
    'user-read-playback-position',
    'user-read-recently-played',
    'user-follow-read',
    'user-follow-modify'
];
const YOUTUBE_API_SCOPES = [
    'https://www.googleapis.com/auth/youtube'
]

const credentialFileSpotify = path.resolve(__dirname, '..', 'credentialsSpotify.json');
const tokenFileSpotify = path.resolve(__dirname, '..', 'tokenSpotify.json');
const tokenFileYT = path.resolve(__dirname, '..', 'tokenYT.json');

const spotifyApi = new SpotifyWebApi({
    redirectUri: `http://localhost:${PORT}/callback`,
    ...require(credentialFileSpotify)
});

const youtubeOAuthClient = oAuth2Client();

const app = express();

app.get('/spotify', (req, res) => {
    res.redirect(spotifyApi.createAuthorizeURL(SPOTIFY_API_SCOPES));
});

app.get('/youtube', (req, res) => {
    res.redirect(youtubeOAuthClient.generateAuthUrl({
        access_type: 'offline',
        scope: YOUTUBE_API_SCOPES,
    }));
});

let tokenReceived = false;
// Google/YouTube OAuth callback
app.get('/', (req, res) => {
    const code = req.query.code;
    if (!code) {
        res.status(500).send('Youtube token code missing');
        return;
    }

    youtubeOAuthClient.getToken(code, (err, token) => {
        if (err) {
            res.status(500).send('Could not fetch YouTube token: ' + err);
            return;
        }
        youtubeOAuthClient.setCredentials(token);

        fs.writeFileSync(tokenFileYT, JSON.stringify(token, null, 4));

        console.log('Successfully retrieved YouTube access token.');
        res.send('Success! You can close this tab now.');

        if (tokenReceived)
            process.exit(0);
        else tokenReceived = true;
    });
});

// Spotify OAuth callback
app.get('/callback', (req, res) => {
    const error = req.query.error;
    const code = req.query.code;

    if (error) {
        console.error('Callback Error:', error);
        res.send(`Callback Error: ${error}`);
        return;
    }

    spotifyApi
        .authorizationCodeGrant(code)
        .then(data => {
            const access_token = data.body['access_token'];
            const refresh_token = data.body['refresh_token'];

            spotifyApi.setAccessToken(access_token);
            spotifyApi.setRefreshToken(refresh_token);

            const tokens = {access_token, refresh_token};

            fs.writeFileSync(tokenFileSpotify, JSON.stringify(tokens, null, 4));

            console.log(`Successfully retrieved Spotify access token.`);
            res.send('Success! You can close this tab now.');

            if (tokenReceived)
                process.exit(0);
            else tokenReceived = true;
        })
        .catch(error => {
            console.error('Error getting Spotify token:', error);
            res.send(`Error getting Spotify tokens: ${error}`);
        });
});

app.listen(PORT, () => {
    console.log('Access Server up on port', PORT);

    open(`http://localhost:${PORT}/spotify`);
    open(`http://localhost:${PORT}/youtube`);
});
