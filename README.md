# EvaCRATE | Version 2

**Enhanced motion design.** The navbar stays visible as the page scrolls.

- [Open this version](https://evacrate-motion-v2.imran-reshamwala2001.chatgpt.site)
- [Other version repository](https://github.com/Raazia-Imran/evaCrate)

A complete, animated corporate website for the EvaCRATE prototype initiative by NST Safeyield Engineers. Ten main pages, privacy and terms notices, and a custom 404 page.

## Run locally

Node.js 20 or later is required. There are no npm dependencies to install.

```sh
npm run build
npm run check
npm run check:security
python -m http.server 8080 --directory dist
```

On Windows, use `py` instead of `python` if necessary. Open `http://localhost:8080`. Use a web server rather than opening HTML files directly.

## Structure

| File | Purpose |
| --- | --- |
| `pages.mjs` | All page copy, content sections and route definitions |
| `components.mjs` | Shared navigation, footer, illustrations and page components |
| `styles.css` | Design system, animations and responsive layouts |
| `app.js` | Accessible interactions, motion control and enquiry handling |
| `crate.js` | Original interactive 3D concept renderer, built on Canvas |
| `motion.js` / `motion.css` | Shared tabs, scroll storytelling, SVG morphing and accessible motion system |
| `motion-blocks.mjs` | Original story, resource garden, chapter reel and engineering notebook |
| `site.config.mjs` | Company details and build-time configuration |
| `assets/` | Supplied logo, derived browser/share assets, CAD and local fonts |
| `scripts/` | Static build and verification |

`dist/` is generated, not a second source tree. Deploy its contents. `.openai/hosting.json` belongs to the private review Site workflow, when present.

## Enquiries

The current contact form validates the fields, prepares an enquiry, and copies it in the browser. It clearly states that nothing was sent. No fake delivery success, invented email address or third-party recipient is configured.

To enable Web3Forms delivery, obtain a key for the client's official receiving inbox, then set these **build environment variables** and rebuild:

```text
SITE_URL=https://the-final-domain.example
CONTACT_EMAIL=the-approved-public-email
WEB3FORMS_ACCESS_KEY=the-client-web3forms-key
```

The client-side Web3Forms key is intended to be public; it is not an email password. Do not put passwords or private credentials into this project. `.env.example` is a guide; this build does not automatically load `.env` files. Use your hosting environment settings, shell environment, or Node's supported `--env-file` option.

The form reports success only after a successful Web3Forms API response. Timeout/error states preserve an enquiry copy. Configure provider-side domain restrictions and spam protection where available. Test actual inbox delivery after configuration; that step cannot be verified without the client's key and inbox.

## Content integrity

Copy is based on the supplied investor slides, investment proposal, logo and requested page structure. The investor proposal is confidential and is **not included in the public website or this repository**. Commercial figures and confidential funding terms have not been copied into the site.

The current design uses PCM and insulation. Evaporative cooling is explained as a separate concept for possible evaluation, not an established prototype feature. PCM recharge, monitoring development and unverified shelf-life claims are represented accurately. No invented customer testimonials, partner endorsements, performance statistics or team identities are used. Reported recognition is explicitly attributed to the supplied team material.

The 3D crate is a conceptual illustration, not a dimensionally accurate CAD model. The original supplied exploded CAD appears separately on the Technology and R&D pages.

## Accessibility and motion

Keyboard-operable navigation, tab groups and native dialogs; labelled form fields; skip link; focus indicators; reduced-motion preference; visible pause/resume control. Canvas rendering pauses off screen and when the tab is hidden. The native Canvas renderer supports dragging, arrow-key rotation and Open / Closed / Layers views without a 3D framework or network dependency. The Home page includes a three-chapter scroll story, a native horizontal chapter reel, and animated typography. Sustainability includes an original SVG resource sculpture; R&D includes an interactive CAD notebook. Native cross-document view transitions enhance supported browsers and fall back to normal navigation. Decorative pointer depth is restricted to fine pointers. CSS animations sleep off screen and in a hidden tab.

## Search and hosting

Each page is rendered to its own HTML file for direct links and search visibility. Build output contains page-specific titles, descriptions, canonical links, Open Graph/Twitter metadata, JSON-LD, `robots.txt`, `sitemap.xml`, browser icons and a 1200 × 630 share card.

Set `SITE_URL` to the final approved public origin before launching a custom domain; rebuild to update canonical and share URLs. A private review Site cannot guarantee public social crawlers can fetch its share image. Validate share previews on the final public domain.

`vercel.json` configures the static build/output, trailing slash and security headers. `dist/_headers` supplies equivalent headers for hosts that support that format. Hosting providers differ: confirm deployed response headers rather than assuming they have been applied. HTTPS certificates, custom-domain DNS, HSTS policy and Search Console ownership are hosting/account tasks.

## Verification

`npm run check` verifies all 13 generated pages, every local link/asset, unique IDs, one H1 per page, metadata, structured data and JavaScript syntax. Browser checks also covered mobile-width layouts across the ten core routes, the conceptual crate, layer tabs, crop selector, article filtering/dialog, scenario arithmetic, required form fields and local enquiry preparation. The enhanced interaction checks covered Open / Closed / Layers model controls, scroll-story chapter changes, horizontal reel movement, notebook click and arrow-key navigation, resource tabs, and the motion toggle on mobile and desktop. Narrow mobile, mobile and tablet layouts were visually reviewed. Web3Forms inbox delivery awaits configuration. `npm run check:security` also verifies CSP directives and structured-data hashes, rejects remote scripts and inline event handlers, checks runtime code for HTML/script evaluation sinks, and confirms unsafe URL or email build configuration is rejected without changing output. These checks cover the shipped static source; they are not a guarantee about future services, hosting configuration or newly added content.

## Assets and references

The EvaCRATE logo and CAD were provided by the project owner. URW Base35 fonts are served locally; see `assets/FONT-LICENSE.txt`. The other illustrations and 3D scene are original code-generated graphics.

- [Web3Forms official JavaScript guide](https://docs.web3forms.com/how-to-guides/html-and-javascript)
- [MDN reduced-motion guidance](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion)
- [SVGator animation reference](https://www.svgator.com/blog/website-animation-examples-and-effects/)
- [Motion accessibility guidance](https://motion.dev/docs/react-accessibility)

There is no database, user account system, cookie advertising or analytics integration in this build. Add services only when their product purpose and privacy requirements are agreed.

## Cloudflare Pages deployment

The static build works with Cloudflare Pages; no Worker, database or paid runtime is required.

| Setting | Value |
| --- | --- |
| GitHub repository | `Raazia-Imran/evaCrate2` |
| Production branch | `main` |
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | Repository root |
| Node version | 22 or later |

Set `SITE_URL` in the Cloudflare build environment to the final production origin (your actual `https://<project>.pages.dev` address or custom domain), with no path or trailing page name. Redeploy after setting it so canonical links, sitemap and share images use that address. Keep the generated `dist/_headers`; it contains the security headers. The custom `404.html` preserves ordinary missing-page handling.

`CONTACT_EMAIL` and `WEB3FORMS_ACCESS_KEY` are optional until enquiry delivery is activated. The current copy-enquiry mode continues to work without them. The original Version 1 repository is maintained separately.

Official references: https://developers.cloudflare.com/pages/configuration/build-configuration/ and https://developers.cloudflare.com/pages/platform/limits/
