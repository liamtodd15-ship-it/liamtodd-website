const { randomBytes } = require('crypto');

exports.handler = async (event) => {
    const state = randomBytes(16).toString('hex');
    const params = new URLSearchParams({
        client_id: process.env.GITHUB_CLIENT_ID,
        redirect_uri: `${process.env.URL}/.netlify/functions/auth-callback`,
        scope: 'repo,user',
        state,
    });

    return {
        statusCode: 302,
        headers: {
            Location: `https://github.com/login/oauth/authorize?${params}`,
            'Cache-Control': 'no-cache',
        },
        body: '',
    };
};
