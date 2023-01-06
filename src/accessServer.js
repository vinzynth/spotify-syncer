const SpotifyWebApi = require('spotify-web-api-node');
const express = require('express');
const fs = require('fs');
const path = require('path');
const open = require('open');

const PORT = 8888;
const API_SCOPES = [
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

const credentialFile = path.resolve(process.argv[2] ?? 'credentials.json');
const tokenFile = path.resolve(__dirname, '..', 'token.json');

const spotifyApi = new SpotifyWebApi({
    redirectUri: `http://localhost:${PORT}/callback`,
    ...require(credentialFile)
});

const app = express();

app.get('/login', (req, res) => {
    res.redirect(spotifyApi.createAuthorizeURL(API_SCOPES));
});

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
            const expires_in = data.body['expires_in'];

            spotifyApi.setAccessToken(access_token);
            spotifyApi.setRefreshToken(refresh_token);

            const tokens = {access_token, refresh_token};

            fs.writeFileSync(tokenFile, JSON.stringify(tokens, null, 4));

            console.log(`Successfully retrieved access token. Expires in ${expires_in}s.`);
            res.send('Success! You can now close the window.');

            setInterval(async () => {
                const data = await spotifyApi.refreshAccessToken();
                const access_token = data.body['access_token'];
                const expires_in = data.body['expires_in'];

                spotifyApi.setAccessToken(access_token);

                tokens.access_token = access_token;
                tokens.expires_in = expires_in;

                fs.writeFileSync(tokenFile, JSON.stringify(tokens, null, 4));

                console.log('The access token has been refreshed!');
            }, expires_in / 2 * 1000);
        })
        .catch(error => {
            console.error('Error getting Tokens:', error);
            res.send(`Error getting Tokens: ${error}`);
        });
});

app.listen(PORT, () => {
    console.log(`Access Server up. Now log in at http://localhost:${PORT}/login with your browser.`)

    open(`http://localhost:${PORT}/login`);
});
