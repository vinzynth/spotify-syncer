# spotify-syncer
NodeJS tool to create Spotify playlists from given YouTube playlists.

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

