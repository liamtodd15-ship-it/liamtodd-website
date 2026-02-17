const fetch = require('node-fetch');

exports.handler = async (event) => {
    const { code } = event.queryStringParameters;

    try {
        const response = await fetch('https://github.com/login/oauth/access_token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept: 'application/json',
            },
            body: JSON.stringify({
                client_id: process.env.GITHUB_CLIENT_ID,
                client_secret: process.env.GITHUB_CLIENT_SECRET,
                code,
            }),
        });

        const data = await response.json();

        const script = `
        <script>
            (function() {
                function receiveMessage(e) {
                    console.log("receiveMessage %o", e);
                    window.opener.postMessage(
                        'authorization:github:success:${JSON.stringify({ token: data.access_token, provider: 'github' })}',
                        e.origin
                    );
                    window.removeEventListener("message", receiveMessage, false);
                }
                window.addEventListener("message", receiveMessage, false);
                window.opener.postMessage("authorizing:github", "*");
            })()
        <\/script>`;

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'text/html' },
            body: `<!DOCTYPE html><html><body>${script}</body></html>`,
        };
    } catch (err) {
        return {
            statusCode: 500,
            body: err.toString(),
        };
    }
};
