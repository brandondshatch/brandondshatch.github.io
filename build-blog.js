#!/usr/bin/env node

/**
 * Blog Build Script for Brandon Hatch Website
 * Converts markdown files in /content/posts to HTML blog posts
 * 
 * Usage: node build-blog.js
 */

const fs = require('fs');
const path = require('path');

// Simple markdown parser (basic implementation)
function parseMarkdown(md) {
    let html = md;
    
    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    
    // Bold
    html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
    
    // Italic
    html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
    
    // Links
    html = html.replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>');
    
    // Code blocks
    html = html.replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>');
    
    // Inline code
    html = html.replace(/`(.*?)`/gim, '<code>$1</code>');
    
    // Blockquotes
    html = html.replace(/^> (.*$)/gim, '<blockquote>$1</blockquote>');
    
    // Horizontal rules
    html = html.replace(/^---$/gim, '<hr>');
    
    // Lists (simple implementation)
    html = html.replace(/^\* (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^- (.*$)/gim, '<li>$1</li>');
    html = html.replace(/^\d+\. (.*$)/gim, '<li>$1</li>');
    
    // Wrap consecutive <li> in <ul>
    html = html.replace(/(<li>.*<\/li>\n?)+/gim, function(match) {
        return '<ul>' + match + '</ul>';
    });
    
    // Paragraphs
    html = html.split('\n\n').map(para => {
        para = para.trim();
        if (!para) return '';
        if (para.startsWith('<')) return para;
        return '<p>' + para + '</p>';
    }).join('\n');
    
    return html;
}

// Extract frontmatter from markdown
function extractFrontmatter(content) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (!match) {
        return { frontmatter: {}, content: content };
    }
    
    const frontmatterText = match[1];
    const bodyContent = match[2];
    
    const frontmatter = {};
    frontmatterText.split('\n').forEach(line => {
        const [key, ...valueParts] = line.split(':');
        if (key && valueParts.length) {
            let value = valueParts.join(':').trim();
            // Remove quotes if present
            value = value.replace(/^["']|["']$/g, '');
            // Handle arrays (tags)
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value.slice(1, -1).split(',').map(s => s.trim().replace(/^["']|["']$/g, ''));
            }
            frontmatter[key.trim()] = value;
        }
    });
    
    return { frontmatter, content: bodyContent };
}

// Main build function
function buildBlog() {
    const postsDir = path.join(__dirname, 'content', 'posts');
    const blogDir = path.join(__dirname, 'blog');
    const templatePath = path.join(blogDir, 'post-template.html');
    
    // Check if directories exist
    if (!fs.existsSync(postsDir)) {
        console.log('Creating content/posts directory...');
        fs.mkdirSync(postsDir, { recursive: true });
        console.log('No markdown files found. Add .md files to content/posts/');
        return;
    }
    
    if (!fs.existsSync(templatePath)) {
        console.error('Error: post-template.html not found in blog directory');
        return;
    }
    
    // Read template
    const template = fs.readFileSync(templatePath, 'utf8');
    
    // Read all markdown files
    const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.md'));
    
    if (files.length === 0) {
        console.log('No markdown files found in content/posts/');
        // Create empty posts.json
        fs.writeFileSync(path.join(blogDir, 'posts.json'), JSON.stringify([], null, 2));
        return;
    }
    
    const posts = [];
    
    files.forEach(file => {
        const filePath = path.join(postsDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        const { frontmatter, content: markdownContent } = extractFrontmatter(content);
        
        // Generate slug from filename
        const slug = path.basename(file, '.md');
        
        // Parse markdown to HTML
        const htmlContent = parseMarkdown(markdownContent);
        
        // Format date (parse as local date to avoid timezone issues)
        const date = frontmatter.date || new Date().toISOString().split('T')[0];
        const [year, month, day] = date.split('-').map(Number);
        const dateObj = new Date(year, month - 1, day); // month is 0-indexed
        const dateFormatted = dateObj.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            timeZone: 'America/Los_Angeles'
        });
        
        // Format tags
        const tags = Array.isArray(frontmatter.tags) ? frontmatter.tags : [];
        const tagsHTML = tags.map(tag => `<span class="tag">${tag}</span>`).join('');
        
        // Replace template variables
        let html = template;
        html = html.replace(/\{\{TITLE\}\}/g, frontmatter.title || 'Untitled');
        html = html.replace(/\{\{EXCERPT\}\}/g, frontmatter.excerpt || '');
        html = html.replace(/\{\{DATE\}\}/g, date);
        html = html.replace(/\{\{DATE_FORMATTED\}\}/g, dateFormatted);
        html = html.replace(/\{\{TAGS\}\}/g, tagsHTML);
        html = html.replace(/\{\{CONTENT\}\}/g, htmlContent);
        
        // Write HTML file
        const outputPath = path.join(blogDir, `${slug}.html`);
        fs.writeFileSync(outputPath, html);
        console.log(`✓ Generated ${slug}.html`);
        
        // Add to posts index
        posts.push({
            title: frontmatter.title || 'Untitled',
            slug: slug,
            date: date,
            excerpt: frontmatter.excerpt || '',
            tags: tags
        });
    });
    
    // Write posts.json
    fs.writeFileSync(
        path.join(blogDir, 'posts.json'),
        JSON.stringify(posts, null, 2)
    );
    console.log(`✓ Generated posts.json with ${posts.length} post(s)`);
    console.log('\nBlog build complete!');
}

// Run build
buildBlog();
