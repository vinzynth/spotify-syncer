# spotify-syncer
NodeJS tool to create Spotify playlists from given YouTube playlists.

## Setup

* Log in on [Spotify Developers](https://developer.spotify.com/dashboard/applications) and create
a new Application.
* Add (http://localhost:8888/callback) as redirect URI in the application settings.
* Copy and paste the `clientId` and `clientSecret` to a `credentials.json` file. Format should be as below:
```json
{
    "clientId": "<YOUR_CLIENT_ID>",
    "clientSecret": "<YOUR_CLIENT_SECRET>"
}
```
* Run `npm run server` or `node src/accessServer`. This will run a webserver locally which requests you to
sign in with your Spotify account. After successfully signing in, you should see a `tokens.json`
file which contains an `access_token` and a `refresh_token`. Those are used by the importer to access
the Spotify api to create playlists and add songs.
* Note: the server automatically updates the `access_token` based on if's expiration time if you leave it 
running, but that is optional. You can as well stop it now.

## Usage

