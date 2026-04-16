const express = require("express");
const router = express.Router();
const config = require('config');

const { AuthorizationCode } = require("simple-oauth2");

const oauthConfig = {
	client: config.get('oauth'),
	auth: {
		tokenHost: "https://account.resonite.com/",
		//tokenHost: "https://localhost:5001/",
		authorizePath: "connect/authorize",
		tokenPath: "connect/token",
	},
	options: {
		bodyFormat: 'form',
		authorizationMethod: 'body'
	},
};

const redirectParams = {
	redirect_uri: "http://localhost:8080",
	scope: ["profile","offline_access"]
};

const client = new AuthorizationCode(oauthConfig);
const authorizationUri = client.authorizeURL(redirectParams);

// This may break later
async function getResoniteProfile(token) {

	const res = await fetch(oauthConfig.auth.tokenHost + 'api/user/profile', {
		headers: {
			'Content-Type': 'application/json',
			'Authorization': `Bearer ${token}`,
		}
	});
	return await res.json();
}

router.get("/authorize", (req, res) => {
	// Start the OAuth Flow
	res.redirect(authorizationUri);
});

router.get("/callback", async (req, res) => {
	// We're back from Resonite, lets change the code into a token

	// The code comes from the query params
	const code = req.query.code;
	try {
		// Exchange the code for a token.
		// You probably need to save this somewhere
		const accessToken = await client.getToken({
			code,
			redirect_uri: redirectParams.redirect_uri
		});

		// Using the token we get the user's Resonite Profile
		const profile = await getResoniteProfile(accessToken.token.access_token);

		// Immediately attempt a refresh for demonstration purposes.
		const refreshedToken = await accessToken.refresh();

		const meta = {
			access: {
				tokenFragment: abbrev(accessToken.token.access_token),
				expires : accessToken.token.expires_at
			},
			refresh: {
				tokenFragment: abbrev(refreshedToken.token.access_token),
				expires : refreshedToken.token.expires_at
			}
		}

		res.render('profile', {
			profile,
			meta
		});

	} catch (error) {
		if(error.data && error.data.payload) {
			console.log(error.data.payload);
		} else {
			console.log(error);
		}
		console.error("Access Token Error", error.message);
		return res.status(500).json("Authentication failed");
	}
});

function abbrev(str) {
	return str.substr(str.length - 6, str.length);
}

module.exports = router;
