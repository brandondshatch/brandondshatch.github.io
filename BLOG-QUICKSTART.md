# Blog Quick Start Guide

## Add a New Post (3 Steps)

### 1. Create Markdown File
Create `content/posts/my-new-post.md`:

```markdown
---
title: My Post Title
date: 2026-02-01
excerpt: Brief description for the blog listing
tags: [video, editing, AI]
---

Write your content here in Markdown.

## Use headings

And **bold** or *italic* text.

* Bullet lists
* Work great
```

### 2. Build
```bash
node build-blog.js
```

### 3. Deploy
```bash
git add -A
git commit -m "Add new blog post: My Post Title"
git push
```

That's it! Your post is live at `brandon-hatch.com/blog/my-new-post.html`

---

## Your Color Palette

From your site's exact design:

| Element | Color | Usage |
|---------|-------|-------|
| Background | `#000000` | Main body |
| Cards | `#121212` | Blog post cards (depth) |
| Text Primary | `#ffffff` | Headings |
| Text Secondary | `#cccccc` | Body text |
| Accent | `rgb(230, 247, 252)` | Links, highlights |
| Borders | `#444444` | Card borders |
| Border Hover | `#666666` | Hover glow |
| Footer BG | `#0a0a0a` | Footer |
| Footer Border | `#222222` | Top border |

## Design Features Active

✓ Glassmorphism (backdrop-filter: blur(10px))  
✓ Hover lift (8px translateY)  
✓ Border glow on hover  
✓ Inter font for readability  
✓ Fully responsive  
✓ Matches main site exactly  

## URLs

- Blog Home: `/blog`
- Posts: `/blog/post-slug.html`
- Content: `content/posts/post-slug.md`
