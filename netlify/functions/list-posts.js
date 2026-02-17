const fs = require('fs').promises;
const path = require('path');

exports.handler = async (event) => {
  // Get folder from query parameter (e.g., ?folder=life)
  const folder = event.queryStringParameters?.folder || 'life';
  
  // Validate folder name to prevent directory traversal
  if (!['life', 'food', 'travel'].includes(folder)) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid folder name' })
    };
  }

  try {
    const postsDir = path.join(process.cwd(), 'posts', folder);
    const files = await fs.readdir(postsDir);
    const mdFiles = files.filter(f => f.endsWith('.md'));
    
    const posts = await Promise.all(
      mdFiles.map(async (file) => {
        const content = await fs.readFile(path.join(postsDir, file), 'utf-8');
        const metadata = parseFrontmatter(content);
        return {
          file: file.replace('.md', ''),
          title: metadata.title || 'Untitled',
          date: metadata.date || '',
          excerpt: metadata.excerpt || ''
        };
      })
    );

    // Sort by date, newest first
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60'
      },
      body: JSON.stringify(posts)
    };
  } catch (error) {
    console.error('Error listing posts:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to load posts', posts: [] })
    };
  }
};

function parseFrontmatter(content) {
  const lines = content.split('\n');
  const data = { title: '', date: '', excerpt: '' };
  let inFrontmatter = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line === '---') {
      if (!inFrontmatter) {
        inFrontmatter = true;
        continue;
      } else {
        break;
      }
    }
    
    if (inFrontmatter) {
      if (line.startsWith('title:')) {
        data.title = line.replace('title:', '').trim().replace(/^["']|["']$/g, '');
      }
      if (line.startsWith('date:')) {
        data.date = line.replace('date:', '').trim();
      }
      if (line.startsWith('excerpt:')) {
        data.excerpt = line.replace('excerpt:', '').trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  
  return data;
}
