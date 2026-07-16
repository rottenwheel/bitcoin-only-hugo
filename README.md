# Bitcoin Only (Hugo)

Sitio estático de [bitcoin-only.com](https://bitcoin-only.com): un directorio de recursos **Bitcoin only** (wallets, meetups, libros, tools, etc.).

Este repositorio es la versión **Hugo** del sitio (antes Nuxt/Vue). Hugo genera HTML estático: no hace falta Node en producción.

---

## Qué incluye

| Parte | Descripción |
|-------|-------------|
| **Contenido** | Páginas en Markdown bajo `content/` (una por sección del menú) |
| **Tema** | `themes/bitcoinonly/` — layouts, CSS (SCSS) y shortcodes |
| **Assets** | Logo, iconos, imágenes en `static/` |
| **Config** | `hugo.toml` — título, `baseURL`, menú lateral |

Al hacer `hugo`, el sitio compilado queda en `public/` (HTML + CSS + estáticos listos para servir).

---

## Requisitos

- [Hugo **extended**](https://gohugo.io/installation/) (hace falta la variante *extended* por el SCSS)
- Git

Comprueba la versión:

```bash
hugo version
# Debe decir "extended", por ejemplo: hugo v0.147.x+extended
```

---

## Estructura del repo

```
bitcoin-only-hugo/
├── content/                 # Páginas (Markdown)
│   ├── _index.md            # Home
│   ├── wallets.md
│   ├── meetups.md
│   └── ...
├── themes/bitcoinonly/
│   ├── assets/css/          # SCSS del sitio (layout, home, nav, pages)
│   └── layouts/
│       ├── _default/        # baseof, home, single
│       ├── partials/        # head, side-nav, mobile nav, etc.
│       └── shortcodes/      # table, getting-started
├── static/                  # Archivos públicos tal cual (logo, icons/, imágenes)
├── hugo.toml                # Configuración del sitio + menú
├── archetypes/              # Plantilla para `hugo new`
└── scripts/                 # Scripts de ayuda (migración); no hace falta para desplegar
```

### Cómo se organiza el contenido

- Cada archivo en `content/*.md` es una ruta: `content/books.md` → `/books/`
- Front matter YAML: `title`, `description`
- Tablas de recursos: shortcode `table` (columnas con `|`)
- Cajas “Getting Started”: shortcode `getting-started`
- El menú lateral se define en `hugo.toml` (`params.navigationLinks`)

### Tema (layouts)

- `baseof.html` — shell (sidebar + contenido)
- `home.html` — rejilla de categorías del home
- `single.html` — resto de páginas
- Shortcodes en `layouts/shortcodes/` generan el markup de tablas compatible con el CSS

---

## Desarrollo local

```bash
git clone https://github.com/rottenwheel/bitcoin-only-hugo.git
cd bitcoin-only-hugo

# Servidor con recarga en caliente (por defecto http://localhost:1313)
hugo server
```

Build de producción (salida en `public/`):

```bash
hugo --minify
```

Antes de desplegar, pon tu dominio real en `hugo.toml`:

```toml
baseURL = 'https://tudominio.com/'
```

---

## Despliegue en un VPS

El resultado es **solo archivos estáticos**. Cualquier servidor web (Nginx, Caddy, Apache) sirve `public/`.

### 1. En el VPS: instalar Hugo extended + Nginx

Ejemplo en Debian/Ubuntu:

```bash
sudo apt update
sudo apt install -y nginx git

# Hugo extended (ajusta la versión si quieres)
HUGO_VERSION=0.147.8
curl -sL "https://github.com/gohugoio/hugo/releases/download/v${HUGO_VERSION}/hugo_extended_${HUGO_VERSION}_linux-amd64.tar.gz" \
  | sudo tar -xz -C /usr/local/bin hugo
hugo version
```

### 2. Clonar y construir

```bash
sudo mkdir -p /var/www/bitcoin-only
sudo chown "$USER":"$USER" /var/www/bitcoin-only
cd /var/www/bitcoin-only

git clone https://github.com/rottenwheel/bitcoin-only-hugo.git .
# Edita baseURL en hugo.toml si hace falta
hugo --minify
```

Los archivos a servir están en `/var/www/bitcoin-only/public`.

### 3. Configurar Nginx

`/etc/nginx/sites-available/bitcoin-only`:

```nginx
server {
    listen 80;
    server_name tudominio.com www.tudominio.com;

    root /var/www/bitcoin-only/public;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    # Cache razonable para assets
    location ~* \.(css|js|png|jpg|jpeg|gif|svg|ico|woff2?)$ {
        expires 7d;
        add_header Cache-Control "public";
    }
}
```

Activar y recargar:

```bash
sudo ln -s /etc/nginx/sites-available/bitcoin-only /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 4. HTTPS (recomendado)

Con [Certbot](https://certbot.eff.org/):

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d tudominio.com -d www.tudominio.com
```

### 5. Actualizar el sitio más adelante

```bash
cd /var/www/bitcoin-only
git pull
hugo --minify
# No hace falta reiniciar Nginx: solo cambian archivos en public/
```

---

## Flujo resumido

```text
Editas Markdown / tema
        ↓
   hugo --minify
        ↓
     public/
        ↓
  Nginx (o Caddy) en el VPS
```

---

## Añadir o editar una página

1. Crea o edita un `.md` en `content/`
2. Si es página nueva, añade el enlace en `hugo.toml` → `params.navigationLinks`
3. Revisa en local con `hugo server`
4. Commit, `git pull` en el VPS y vuelve a ejecutar `hugo --minify`

---

## Notas

- Hace falta **Hugo extended** (Dart Sass / SCSS del tema).
- `public/` y `resources/` están en `.gitignore`: se generan en cada build; no se versionan.
- `markup.goldmark.renderer.unsafe = true` permite HTML en el Markdown (necesario para tablas y enlaces ricos).

## Licencia

Ver [LICENSE](LICENSE) si existe en el repo; el proyecto original Bitcoin Only es open source orientado a la comunidad.
