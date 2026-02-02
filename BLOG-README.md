# Brandon Hatch Blog System

A simple, elegant blog system that converts Markdown files to static HTML pages matching your site's dark aesthetic.

## Quick Start

### 1. Create a New Blog Post

Add a `.md` file to `content/posts/` with frontmatter:

```markdown
---
title: Your Post Title
date: 2026-02-01
excerpt: A brief description that appears on the blog listing page
tags: [video editing, storytelling, AI]
---

Your post content goes here in **Markdown** format.

## Headings work great

* Lists too
* Very nice

> Blockquotes look professional

And inline `code` is supported.
```

### 2. Build the Blog

Run the build script to convert your Markdown files to HTML:

```bash
node build-blog.js
```

This will:
- Convert all `.md` files in `content/posts/` to HTML pages in `/blog/`
- Generate a `posts.json` file for the blog index
- Use your site's exact color scheme (#000000 black, #121212 cards, glassmorphism effects)

### 3. View Your Blog

- Blog listing: `https://brandon-hatch.com/blog`
- Individual posts: `https://brandon-hatch.com/blog/your-post-slug.html`

## File Structure

```
brandon_website/
├── blog/
│   ├── index.html           # Blog listing page (glassmorphism cards)
│   ├── post-template.html   # Template for individual posts
│   ├── posts.json          # Auto-generated index (don't edit manually)
│   └── *.html              # Generated blog posts
├── content/
│   └── posts/
│       └── *.md            # Your markdown blog posts (add here!)
└── build-blog.js           # Build script
```

## Markdown Features Supported

- **Headers** (`#`, `##`, `###`)
- **Bold** (`**text**`)
- **Italic** (`*text*`)
- **Links** (`[text](url)`)
- **Code blocks** (` ```code``` `)
- **Inline code** (`` `code` ``)
- **Lists** (`*`, `-`, `1.`)
- **Blockquotes** (`>`)
- **Horizontal rules** (`---`)

## Design Features

### Color Scheme (from your site)
- Background: `#000000` (pure black)
- Cards: `#121212` (slightly lighter black for depth)
- Text: `#ffffff` (white) and `#cccccc` (light gray)
- Accents: `rgb(230, 247, 252)` (light blue)
- Borders: `#444444`, `#666666` (gray gradients)

### Effects
- **Glassmorphism cards** with `backdrop-filter: blur(10px)`
- **Hover lift** effect (8px translateY)
- **Border glow** on hover (subtle gray)
- **Typography**: Inter font for clean readability on dark backgrounds
- **Responsive design** for all screen sizes

## Workflow

1. Write post in `content/posts/your-post-name.md`
2. Run `node build-blog.js`
3. Commit and push to GitHub
4. GitHub Pages automatically deploys

## Tips

- **Slug is filename**: `my-post.md` becomes `brandon-hatch.com/blog/my-post.html`
- **Date format**: Use `YYYY-MM-DD` in frontmatter
- **Tags**: Use array format `[tag1, tag2, tag3]`
- **Excerpt**: Keep it under 160 characters for best display

## Example Frontmatter

```yaml
---
title: The Future of AI-Assisted Editing
date: 2026-02-15
excerpt: How AI tools are changing video production workflows without replacing human creativity.
tags: [AI, editing, workflow, future]
---
```

## Navigation

The blog is integrated into your main site navigation:
- Home → What I Do → Work → Services → **Blog** → Book a Call

All pages maintain your dark aesthetic with consistent styling.
