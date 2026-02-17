const fs = require('fs');
const path = require('path');

exports.handler = async function(event) {
    const category = event.queryStringParameters && event.queryStringParameters.category;

    if (!category || !['life', 'food', 'travel'].includes(category)) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid category' })
        };
    }

    const postsDir = path.join(__dirname, '..', '..', 'posts', category);

    try {
        if (!fs.existsSync(postsDir)) {
            return {
                statusCode: 200,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify([])
            };
        }

        const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
        const posts = [];

        for (const file of files) {
            const content = fs.readFileSync(path.join(postsDir, file), 'utf8');
            const post = parseFrontmatter(content);
            post.file = file.replace('.md', '.html');
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
