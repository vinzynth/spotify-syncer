# spotify-syncer
NodeJS CLI tool to create Spotify playlists from given YouTube playlists.

## Setup

In order to set this application up, you need to set up an API connection to both Spotify and YouTube.
This repository contains an access-server which handles the OAuth authentication process for both APIs.
First you need to set up an application on both platforms:

### Spotify API

* Log in on [Spotify Developers](https://developer.spotify.com/dashboard/applications) and create
a new Application.
* Add (http://localhost:80/callback) as redirect URI in the application settings.
* Copy and paste the `clientId` and `clientSecret` to a `credentialsSpotify.json` file. Format should be as below:
```json
{
    "clientId": "<YOUR_CLIENT_ID>",
    "clientSecret": "<YOUR_CLIENT_SECRET>"
}
```

### YouTube API

* Log into the [Google Cloud Console](https://console.cloud.google.com/apis/credentials) and create a new
OAuth client ID for your project. Choose `Desktop app` as application type.
* Download the JSON with the client credentials. Rename it to `credentialsYT.json`.
 
### Start Access Server

* Run `npm run server` or `node src/accessServer`. This will run a webserver locally which requests you to
  sign in with your Spotify/YouTube account. After successfully signing in on both sites, you should see
  `tokensYT.json` and `tokenSpotify.json` file which contains an `access_token` and a `refresh_token`. Those
  are used by the script to access the APIs.

* **DO NOT SHARE THOSE TOKEN AND CREDENTIAL FILES WITH ANYONE**.

* Note: The access server runs on port 80 because it uses the default redirect uri for the YouTube API.
if you want to change that, you also need to set the redirect uris at the Spotify and YouTube application
accordingly.

## Usage

Once set up just run `index.js` or `npm start`. The script asks you for a playlist. You can paste the link to the
YouTube playlist, or a video playing from that playlist.

## Limitations

This tool uses video title and music metadata tags from YouTube and tries to match it with search results from Spotify.
For the most part this performs well, however sometimes special remixes are not properly found and the original (more 
popular) version gets added to the playlist instead. Sometimes videos on YouTube have neither a title, nor a music 
metadata added by YouTube. Those can't be matched. Some videos use unicode symbols or emojis in their titles, which the script
tries to normalize utilizing a 3rd party library. Video titles not made of latin characters seem to be matched correctly.