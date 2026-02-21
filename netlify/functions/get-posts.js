exports.handler = async function(event) {
    const category = event.queryStringParameters && event.queryStringParameters.category;

    if (!category || !['life', 'food', 'travel', 'finance'].includes(category)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid category' })
        };
    }

    try {
        const apiUrl = `https://api.github.com/repos/liamtodd15-ship-it/liamtodd-website/contents/posts/${category}`;
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'liamtodd-website'
            }
        });

        if (response.status === 404) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([])
            };
        }

        const files = await response.json();
        const mdFiles = files.filter(f => f.name.endsWith('.md'));
        const posts = [];

        for (const file of mdFiles) {
            const fileRes = await fetch(file.download_url);
            const content = await fileRes.text();
            const post = parseFrontmatter(content);
            post.file = file.name.replace('.md', '.html');
            posts.push(post);
        }

        posts.sort((a, b) => new Date(b.date) - new Date(a.date));

        return {
            statusCode: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(posts)
        };

    } catch (err) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: err.message })
        };
    }
};

function parseFrontmatter(content) {
    const lines = content.split('\n');
    const data = { title: '', date: '', excerpt: '' };
    let inFrontmatter = false;

    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '---') {
            if (!inFrontmatter) { inFrontmatter = true; continue; }
            else { break; }
        }
        if (inFrontmatter) {
            if (trimmed.startsWith('title:')) data.title = trimmed.replace('title:', '').trim().replace(/^["']|["']$/g, '');
            if (trimmed.startsWith('date:')) data.date = trimmed.replace('date:', '').trim();
            if (trimmed.startsWith('excerpt:')) data.excerpt = trimmed.replace('excerpt:', '').trim().replace(/^["']|["']$/g, '');
        }
    }
    return data;
}
