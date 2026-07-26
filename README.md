# Bitcoin Only (Hugo)

Static site for [btc.rottenwheel.com](https://btc.rottenwheel.com/): a directory of **Bitcoin only** resources (wallets, meetups, books, tools, etc.). Forgejo [mirror](https://git.private.coffee/rottenwheel/bitcoin-only-hugo), courtesy of [private.coffee](https://private.coffee/). Gitea [mirror](https://git.poster.place/rottenwheel/bitcoin-only-hugo), courtesy of [poster.place](https://poster.place/). Even more [here](https://git.bloat.cat/rottenwheel/bitcoin-only-hugo) (Forgejo).

This repository is the **Hugo** version of the site (previously Nuxt/Vue). Hugo generates static HTML: no Node needed in production. Upstream [repository](https://github.com/bitcoin-only/bitcoin-only).

---

## What's included

| Part | Description |
|-------|-------------|
| **Content** | Markdown pages under `content/` (one per menu section) |
| **Theme** | `themes/bitcoinonly/` — layouts, CSS (SCSS) and shortcodes |
| **Assets** | Logo, icons, images in `static/` |
| **Config** | `hugo.toml` — title, `baseURL`, sidebar menu |

Running `hugo` builds the compiled site into `public/` (HTML + CSS + static files ready to serve).

---

## Requirements

- [Hugo **extended**](https://gohugo.io/installation/) (the *extended* variant is needed for SCSS)
- Git

Check the version:

```bash
hugo version
# Should say "extended", e.g.: hugo v0.147.x+extended
```

---

## Repo structure

```
bitcoin-only-hugo/
├── content/                 # Pages (Markdown)
│   ├── _index.md            # Home
│   ├── wallets.md
│   ├── meetups.md
│   └── ...
├── themes/bitcoinonly/
│   ├── assets/css/          # Site SCSS (layout, home, nav, pages)
│   └── layouts/
│       ├── _default/        # baseof, home, single
│       ├── partials/        # head, side-nav, mobile nav, etc.
│       └── shortcodes/      # table, getting-started
├── static/                  # Public files as-is (logo, icons/, images)
├── hugo.toml                # Site configuration + menu
├── archetypes/              # Template for `hugo new`
└── scripts/                 # Helper scripts (migration); not needed for deployment
```

### How content is organized

- Each file in `content/*.md` is a route: `content/books.md` → `/books/`
- YAML front matter: `title`, `description`
- Resource tables: `table` shortcode (columns with `|`)
- "Getting Started" boxes: `getting-started` shortcode
- The sidebar menu is defined in `hugo.toml` (`params.navigationLinks`)

### Theme (layouts)

- `baseof.html` — shell (sidebar + content)
- `home.html` — category grid on the home page
- `single.html` — the rest of the pages
- Shortcodes in `layouts/shortcodes/` generate table markup compatible with the CSS

---

## Local development

```bash
git clone https://github.com/rottenwheel/bitcoin-only-hugo.git
cd bitcoin-only-hugo

# Server with hot reload (default http://localhost:1313)
hugo server
```

Production build (output in `public/`):

```bash
hugo --minify
```

Before deploying, set your real domain in `hugo.toml`:

```toml
baseURL = 'https://yourdomain.com/'
```

---

## Deploying on a VPS

The result is **static files only**. Any web server (Nginx, Caddy, Apache) can serve `public/`.

### 1. On the VPS: install Hugo extended + Nginx

Example on Debian/Ubuntu:

```bash
sudo apt update
sudo apt install -y nginx git

# Hugo extended (adjust the version if you like)
HUGO_VERSION=0.147.8
curl -sL "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz" \
  | sudo tar -xz -C /usr/local/bin hugo
hugo version
```

### 2. Clone and build

```bash
sudo mkdir -p /var/www/bitcoin-only
sudo chown "$USER":"$USER" /var/www/bitcoin-only
cd /var/www/bitcoin-only

git clone https://github.com/rottenwheel/bitcoin-only-hugo.git .
# Edit baseURL in hugo.toml if needed
hugo --minify
```

The files to serve are in `/var/www/bitcoin-only/public`.

### 3. Configure Nginx

`/etc/nginx/sites-available/bitcoin-only`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/bitcoin-only/public;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Reasonable caching for assets
    location ~* \.(css|js|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public";
    }
}
```

Enable and reload:

```bash
sudo ln -s /etc/nginx/sites-available/bitcoin-only /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. HTTPS (recommended)

With [Certbot](https://certbot.eff.org/):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 5. Updating the site later

```bash
cd /var/www/bitcoin-only
git pull
hugo --minify
# No need to restart Nginx: only files in public/ change
```

---

## Summarized workflow

```text
Edit Markdown / theme
        ↓
   hugo --minify
        ↓
     public/
        ↓
  Nginx (or Caddy) on the VPS
```

---

## Adding or editing a page

1. Create or edit a `.md` file in `content/`
2. If it's a new page, add the link in `hugo.toml` → `params.navigationLinks`
3. Check it locally with `hugo server`
4. Commit, `git pull` on the VPS and run `hugo --minify` again

---

## Notes

- **Hugo extended** is required (Dart Sass / theme SCSS).
- `public/` and `resources/` are in `.gitignore`: they are generated on each build and are not version-controlled.
- `markup.goldmark.renderer.unsafe = true` allows HTML in Markdown (necessary for tables and rich links).

## License

See [LICENSE](LICENSE); the original Bitcoin Only project is open-source and community-oriented.
