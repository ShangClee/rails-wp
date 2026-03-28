# Getting Started with Rails WP CMS

A complete WordPress-compatible CMS built with Rails. No PHP required.

---

## Prerequisites

- **Docker** & **Docker Compose** installed
- **Git** for version control
- A modern web browser (Chrome, Firefox, Safari, Edge)

That's it! Everything else runs in containers.

---

## Quick Start (5 minutes)

### 1. Clone & Start
```bash
cd /path/to/rails-wp
docker compose up --build
```

Wait for "PostgreSQL is ready to accept connections" (or similar for MariaDB).

### 2. Initialize WordPress
Visit: **http://localhost:8080/admin/setup.html**

- Admin username: `admin`
- Admin password: Choose something secure
- Site title: Your site name
- Admin email: Your email

Click "Install WordPress" and wait for success message.

### 3. Access Your CMS

| What | URL | Purpose |
|------|-----|---------|
| **Public Site** | http://localhost:8888 | Blog frontend |
| **Admin Panel** | http://localhost:8080/admin/ | Create posts, manage users, settings |
| **Database** | http://localhost:8181 | phpMyAdmin (rarely needed) |

---

## Creating Your First Post

### Via Admin Panel (Easiest)
1. Go to http://localhost:8080/admin/
2. Click "Posts" in the left menu
3. Click "Add New" button
4. Enter title, content, set status to "Published"
5. Click "Save Post"
6. Check http://localhost:8888 to see it live

### Via REST API (For Integration)
```bash
curl -X POST http://localhost:8888/api/v2/posts \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "post": {
      "post_title": "Hello World",
      "post_content": "This is my first post!",
      "post_status": "publish"
    }
  }'
```

### Via GraphQL (Modern)
```bash
curl -X POST http://localhost:8888/graphql \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "mutation { createPost(title: \"Hello\", content: \"World\", status: \"publish\") { post { id title } } }"
  }'
```

---

## Common Tasks

### Add a New User
1. Go to admin → System → Users
2. Click "Add New"
3. Enter username, email, password
4. Choose role (Administrator, Editor, Author, Contributor, Subscriber)
5. Click "Save"

### Create a Page (Static Content)
1. Admin → CMS → Pages
2. Click "Add New Page"
3. Enter title and content
4. Set status to "Published"
5. Click "Save"
6. Access at: http://localhost:8888/page-slug-here

### Upload Images
1. Admin → CMS → Media
2. Click "Upload"
3. Select image file from computer
4. (Used automatically when creating posts with images)

### Configure Site Settings
1. Admin → System → Settings
2. Update site name, URL, email, timezone, etc.
3. Click "Save Settings"

---

## Understanding the Admin Panel

### CMS Tab
- **Posts** — Blog entries (multiple authors, categories, tags)
- **Pages** — Static pages (About, Contact, etc.)
- **Media** — File uploads (images, documents)
- **Menus** — Navigation menus for your site

### System Tab
- **Users** — Manage user accounts and roles
- **Roles** — View available roles and permissions
- **Tokens** — JWT authentication tokens (for API access)
- **Health** — System status (DB, Redis, content counts)
- **Settings** — Site configuration (name, URL, timezone, etc.)

---

## Working with Content

### Role Permissions

| Role | Can Do |
|------|--------|
| **Subscriber** | Read content only |
| **Contributor** | Create unpublished posts |
| **Author** | Create & publish own posts |
| **Editor** | Manage all content (posts, pages, comments) |
| **Administrator** | Everything (users, settings, site config) |

### Post Status
- **Draft** — Private, not visible to public
- **Published** — Live on site, visible to everyone
- **Pending** → Awaiting editor review

### Comments
- Comments are **moderated** (must approve before showing)
- Logged-in users are auto-approved (configurable)
- Guests have comments pending approval

---

## API Authentication

To access protected endpoints, you need a JWT token.

### Get a Token
```bash
curl -X POST http://localhost:8888/api/v2/login \
  -H "Content-Type: application/json" \
  -d '{
    "wp_user": {
      "user_login": "admin",
      "password": "your_password"
    }
  }'
```

Response:
```json
{
  "message": "Logged in successfully",
  "user": { "ID": 1, "user_login": "admin" },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Use the Token
```bash
curl -X GET http://localhost:8888/api/v2/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

---

## Useful Admin URLs

| Feature | URL |
|---------|-----|
| Setup wizard | http://localhost:8080/admin/setup.html |
| Admin panel | http://localhost:8080/admin/ |
| Posts | http://localhost:8080/admin/#cms/posts |
| Pages | http://localhost:8080/admin/#cms/pages |
| Media | http://localhost:8080/admin/#cms/media |
| Users | http://localhost:8080/admin/#system/users |
| Settings | http://localhost:8080/admin/#system/settings |

---

## Viewing Your Site

### Public Site Structure
```
http://localhost:8888/                  → Posts listing (home page)
http://localhost:8888/posts              → Same as above
http://localhost:8888/posts/1            → Single post detail
http://localhost:8888/about              → Static page (slug = "about")
http://localhost:8888/contact            → Static page (slug = "contact")
```

### Sample Content Setup
After initialization, create:
1. **About page** — Slug: "about", Content: Your bio
2. **First post** — Title: "Welcome to My Blog"
3. **Contact page** — Slug: "contact", Content: Contact form/email

---

## Troubleshooting

### Admin Panel Won't Load
**Check**: Are all Docker containers running?
```bash
docker compose ps
```

All services should show "Up". If not:
```bash
docker compose up --build
```

### Can't Login to Admin
**Check**: Did you run setup wizard?
Visit http://localhost:8080/admin/setup.html

**Check**: Is the password correct?
Use the password you set during setup.

### Public Site Shows "Posts not found"
**Create a post first:**
1. Go to Admin → CMS → Posts
2. Click "Add New"
3. Enter title, content
4. Set status to "Published"
5. Click "Save"

### Can't Upload Files
**Check**: Is the media upload working?
Try uploading a small image (< 5MB) first.

**Check**: Disk space?
Ensure your system has at least 1GB free.

### API Returns 401 Unauthorized
**Problem**: JWT token expired or invalid

**Solution**:
1. Get a new token (see "API Authentication" above)
2. Use the new token in requests

---

## Development Tips

### Live Reload
- **Rails**: Changes auto-reload (no restart needed)
- **Admin JS**: Refresh browser to see changes
- **CSS**: Changes auto-compile (watch Tailwind)

### Useful Commands

```bash
# View logs
docker compose logs -f backwp          # Rails logs
docker compose logs -f frontwp         # Nginx logs
docker compose logs -f db              # Database logs

# Access Rails console
docker compose exec backwp bundle exec rails console

# Run tests
docker compose exec backwp bundle exec rspec

# Database shell
docker compose exec db mariadb -uroot -ppassword wpress691

# Watch CSS changes
cd frontWP && npm run watch:css
```

---

## Next Steps

### Learn More
- **API Docs**: Visit http://localhost:8888/api-docs (Swagger)
- **GraphQL Playground**: Use any GraphQL client pointing to http://localhost:8888/graphql
- **Code**: Explore `backWP/` for backend, `frontWP/` for frontend

### Customization Ideas
- Add custom post types
- Create custom taxonomies
- Build custom admin modules
- Integrate external APIs
- Add webhooks for automation

### Deployment
This CMS is ready for production. See `PROJECT_SUMMARY.md` for deployment considerations.

---

## Support

### Documentation Files
- **CLAUDE.md** — Development guide for code contributors
- **PROJECT_SUMMARY.md** — Architecture and implementation details
- **This file** — Getting started guide for users

### Common Issues

**Issue**: Docker won't start
- Ensure Docker daemon is running
- Check disk space
- Try `docker compose down` then `docker compose up`

**Issue**: Admin panel is slow
- Increase Docker memory allocation
- Check database logs for slow queries

**Issue**: File uploads fail
- Check file size (limit: 100MB by default)
- Verify disk space on host
- Check file permissions

---

## Enjoy Your CMS! 🎉

You now have a complete, WordPress-compatible CMS built on Rails with:
- ✅ Full REST API
- ✅ GraphQL support
- ✅ Powerful admin panel
- ✅ Public blog frontend
- ✅ User & role management
- ✅ Comments & moderation
- ✅ File uploads
- ✅ SEO-friendly URLs

Start creating content, and customize it to your needs!

**Questions?** Check the code in `backWP/` and `frontWP/` — it's clean and well-organized.
