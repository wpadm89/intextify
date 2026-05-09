import os
import re

CSS_ADDITION = """
/* --- Navigation Header Styles --- */
:root {
  --nav-height: 64px;
  --primary:    #0f172a;
  /* --accent is skipped as per instructions to avoid conflicts */
  --accent-rgb: 245, 158, 11;
  --bg:         #f8fafc;
  --surface:    #ffffff;
  --text:       #0f172a;
  --muted:      #64748b;
  --border:     rgba(15, 23, 42, 0.08);
  --nav-bg:     rgba(255, 255, 255, 0.82);
  --ease:       cubic-bezier(0.4, 0, 0.2, 1);
  --font:       'Plus Jakarta Sans', system-ui, sans-serif;
}

[data-theme="dark"] {
  --bg:      #060d1f;
  --surface: #0d1628;
  --text:    #e2e8f0;
  --muted:   #94a3b8;
  --border:  rgba(255, 255, 255, 0.07);
  --nav-bg:  rgba(6, 13, 31, 0.88);
}

body { font-family: var(--font); }

.nav-header {
  position: sticky; top: 0; z-index: 999;
  height: var(--nav-height);
  background: var(--nav-bg);
  border-bottom: 1px solid var(--border);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  transition: box-shadow 0.3s var(--ease), border-color 0.3s;
  animation: nav-slide-down 0.5s var(--ease) both;
}
.nav-header.scrolled { box-shadow: 0 4px 24px rgba(15, 23, 42, 0.07); }

@keyframes nav-slide-down {
  from { transform: translateY(-100%); opacity: 0; }
  to   { transform: translateY(0);    opacity: 1; }
}

.nav-inner {
  max-width: 1280px; margin: 0 auto; padding: 0 24px;
  height: 100%; display: flex; align-items: center;
  justify-content: space-between; gap: 24px;
}

.nav-logo {
  display: flex; align-items: center; gap: 10px;
  text-decoration: none; flex-shrink: 0; outline: none;
}
.nav-logo-icon {
  width: 34px; height: 34px; border-radius: 9px;
  background: linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%);
  display: flex; align-items: center; justify-content: center;
  transition: transform 0.35s var(--ease), box-shadow 0.35s;
  flex-shrink: 0;
}
.nav-logo:hover .nav-logo-icon {
  transform: rotate(-7deg) scale(1.1);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.22);
}
.nav-logo-icon svg {
  width: 18px; height: 18px; fill: none; stroke: var(--accent); /* Used existing accent */
  stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round;
}
.nav-logo-text {
  font-weight: 700; font-size: 17px; color: var(--text);
  letter-spacing: -0.3px; transition: color 0.3s;
}
.nav-logo-text span { color: var(--accent); }

.nav-links { display: flex; align-items: center; gap: 2px; list-style: none; }

.nav-link {
  position: relative; display: block; padding: 8px 14px;
  font-size: 14px; font-weight: 500; color: var(--muted);
  text-decoration: none; border-radius: 8px;
  transition: color 0.25s, background 0.25s; white-space: nowrap;
}
.nav-link::after {
  content: ''; position: absolute; bottom: 5px;
  left: 14px; right: 14px; height: 2px;
  background: var(--accent); border-radius: 2px;
  transform: scaleX(0); transform-origin: left center;
  transition: transform 0.28s var(--ease);
}
.nav-link:hover { color: var(--text); background: rgba(15, 23, 42, 0.04); }
[data-theme="dark"] .nav-link:hover { background: rgba(255, 255, 255, 0.05); }
.nav-link:hover::after,
.nav-link[aria-current="page"]::after { transform: scaleX(1); }
.nav-link[aria-current="page"] { color: var(--text); }

.nav-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }

.unit-toggle {
  display: flex; align-items: center;
  background: rgba(15, 23, 42, 0.06);
  border-radius: 8px; padding: 3px; gap: 2px; transition: background 0.3s;
}
[data-theme="dark"] .unit-toggle { background: rgba(255, 255, 255, 0.07); }
.unit-btn {
  padding: 4px 11px; font-size: 12px; font-weight: 600;
  font-family: var(--font); border: none; background: transparent;
  color: var(--muted); border-radius: 6px; cursor: pointer;
  transition: all 0.22s var(--ease);
}
.unit-btn.active {
  background: var(--surface); color: var(--text);
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.12);
}

.dark-toggle {
  width: 36px; height: 36px; border-radius: 9px;
  border: 1px solid var(--border); background: var(--surface);
  cursor: pointer; display: flex; align-items: center;
  justify-content: center;
  transition: border-color 0.25s, transform 0.25s;
  position: relative; overflow: hidden;
}
.dark-toggle:hover {
  border-color: rgba(var(--accent-rgb), 0.5); transform: scale(1.07);
}
.dark-toggle svg {
  width: 16px; height: 16px; stroke: var(--muted); stroke-width: 2;
  fill: none; stroke-linecap: round; stroke-linejoin: round;
  position: absolute; transition: transform 0.4s var(--ease), opacity 0.3s;
}
.icon-sun  { opacity: 1; transform: rotate(0deg)   scale(1);   }
.icon-moon { opacity: 0; transform: rotate(90deg)  scale(0.5); }
[data-theme="dark"] .icon-sun  { opacity: 0; transform: rotate(-90deg) scale(0.5); }
[data-theme="dark"] .icon-moon { opacity: 1; transform: rotate(0deg)   scale(1);   }

.nav-cta {
  padding: 8px 18px; font-size: 13px; font-weight: 600;
  font-family: var(--font); background: var(--primary); color: #fff;
  border: none; border-radius: 9px; cursor: pointer;
  letter-spacing: -0.1px;
  transition: transform 0.25s var(--ease), box-shadow 0.25s;
  position: relative; overflow: hidden;
}
[data-theme="dark"] .nav-cta { background: #e2e8f0; color: #0f172a; }
.nav-cta::before {
  content: ''; position: absolute; inset: 0;
  background: rgba(255,255,255,0.13); opacity: 0; transition: opacity 0.2s;
}
.nav-cta:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(15,23,42,0.18); }
.nav-cta:hover::before { opacity: 1; }
.nav-cta:active { transform: translateY(0); box-shadow: none; }

.nav-hamburger {
  display: none; width: 36px; height: 36px; border-radius: 9px;
  border: 1px solid var(--border); background: var(--surface);
  cursor: pointer; flex-direction: column; align-items: center;
  justify-content: center; gap: 5px; transition: border-color 0.25s;
}
.nav-hamburger:hover { border-color: rgba(var(--accent-rgb), 0.5); }
.ham-bar {
  width: 16px; height: 1.5px; background: var(--text);
  border-radius: 2px; display: block;
  transition: transform 0.32s var(--ease), opacity 0.22s;
}
.nav-hamburger.open .ham-bar:nth-child(1) { transform: translateY(6.5px) rotate(45deg); }
.nav-hamburger.open .ham-bar:nth-child(2) { opacity: 0; transform: scaleX(0); }
.nav-hamburger.open .ham-bar:nth-child(3) { transform: translateY(-6.5px) rotate(-45deg); }

.nav-mobile-menu {
  position: absolute; top: 100%; left: 0; right: 0;
  background: var(--nav-bg); backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
  border-bottom: 1px solid var(--border);
  max-height: 0; overflow: hidden;
  transition: max-height 0.42s var(--ease);
}
.nav-mobile-menu.open { max-height: 340px; }
.nav-mobile-inner {
  padding: 10px 20px 20px; display: flex; flex-direction: column; gap: 4px;
}
.mob-nav-link {
  padding: 11px 14px; font-size: 14px; font-weight: 500;
  color: var(--muted); text-decoration: none; border-radius: 9px;
  transition: color 0.2s, background 0.2s;
  opacity: 0; transform: translateX(-10px);
}
.nav-mobile-menu.open .mob-nav-link {
  animation: mob-link-in 0.35s var(--ease) forwards;
}
.nav-mobile-menu.open .mob-nav-link:nth-child(1) { animation-delay: 0.05s; }
.nav-mobile-menu.open .mob-nav-link:nth-child(2) { animation-delay: 0.10s; }
.nav-mobile-menu.open .mob-nav-link:nth-child(3) { animation-delay: 0.15s; }
@keyframes mob-link-in { to { opacity: 1; transform: translateX(0); } }
.mob-nav-link:hover { color: var(--text); background: rgba(15,23,42,0.05); }
[data-theme="dark"] .mob-nav-link:hover { background: rgba(255,255,255,0.06); }
.mob-divider { height: 1px; background: var(--border); margin: 8px 14px; }
.mob-cta {
  margin: 4px 14px 0; padding: 11px; font-size: 14px; font-weight: 600;
  font-family: var(--font); background: var(--primary); color: #fff;
  border: none; border-radius: 9px; cursor: pointer; text-align: center;
  opacity: 0; transform: translateX(-10px);
}
.nav-mobile-menu.open .mob-cta {
  animation: mob-link-in 0.35s var(--ease) 0.20s forwards;
}
[data-theme="dark"] .mob-cta { background: #e2e8f0; color: #0f172a; }

@media (max-width: 768px) {
  .nav-links, .unit-toggle, .nav-cta { display: none !important; }
  .nav-hamburger { display: flex; }
}
"""

HTML_HEADER = """<header class="nav-header" id="mainHeader" role="banner">
  <div class="nav-inner">

    <!-- SEO: Descriptive logo link with brand name as crawlable text -->
    <a href="/" class="nav-logo" aria-label="Intextify - Construction Calculators Pakistan">
      <div class="nav-logo-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      </div>
      <span class="nav-logo-text">Intex<span>tify</span></span>
    </a>

    <!-- SEO: Wrapped in <nav> with aria-label for Google to identify primary navigation -->
    <nav aria-label="Primary navigation">
      <ul class="nav-links" role="list">
        <li><a href="/"             class="nav-link">Calculators</a></li>
        <li><a href="/guides"       class="nav-link">Guides</a></li>
        <li><a href="/write-for-us" class="nav-link">Write for Us</a></li>
      </ul>
    </nav>

    <div class="nav-right">

      <div class="unit-toggle" role="group" aria-label="Measurement unit">
        <button class="unit-btn active" data-unit="sqft" aria-pressed="true">sqft</button>
        <button class="unit-btn"        data-unit="sqm"  aria-pressed="false">sqm</button>
      </div>

      <button class="dark-toggle" id="darkToggle" aria-label="Enable dark mode">
        <svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="5"/>
          <line x1="12" y1="1"  x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22"   x2="5.64"  y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1"  y1="12" x2="3"  y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22"  y1="19.78" x2="5.64"  y2="18.36"/>
          <line x1="18.36" y1="5.64"  x2="19.78" y2="4.22"/>
        </svg>
        <svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/>
        </svg>
      </button>

      <button class="nav-cta" aria-label="Get started with Intextify">Get Started</button>

      <button class="nav-hamburger" id="menuToggle"
              aria-label="Open navigation menu"
              aria-expanded="false"
              aria-controls="mobileMenu">
        <span class="ham-bar" aria-hidden="true"></span>
        <span class="ham-bar" aria-hidden="true"></span>
        <span class="ham-bar" aria-hidden="true"></span>
      </button>

    </div>
  </div>

  <!-- SEO: Mobile links in DOM = fully crawlable by Google -->
  <div class="nav-mobile-menu" id="mobileMenu">
    <nav aria-label="Mobile navigation">
      <div class="nav-mobile-inner">
        <a href="/"             class="mob-nav-link">Calculators</a>
        <a href="/guides"       class="mob-nav-link">Guides</a>
        <a href="/write-for-us" class="mob-nav-link">Write for Us</a>
        <div class="mob-divider" aria-hidden="true"></div>
        <button class="mob-cta">Get Started</button>
      </div>
    </nav>
  </div>
</header>
"""

# Update styles.css
with open('styles.css', 'r', encoding='utf-8') as f:
    css_content = f.read()

# Add import at the very top, before @tailwind base;
if "@import url(" not in css_content:
    if "@tailwind base;" in css_content:
        css_content = css_content.replace("@tailwind base;", "@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');\n@tailwind base;")
    else:
        css_content = "@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');\n" + css_content

if ".nav-header {" not in css_content:
    css_content += "\n" + CSS_ADDITION

with open('styles.css', 'w', encoding='utf-8') as f:
    f.write(css_content)
print("Updated styles.css")

# Update HTML files
html_files = ['index.html', 'guides.html', 'guide-5-marla.html', 'admin.html', 'write-for-us.html']

def remove_classes(match):
    tag_name = match.group(1)
    classes_str = match.group(2)
    classes = classes_str.split()
    to_remove = ['flex-row', 'lg:flex-row', 'ml-64', 'pl-64', 'overflow-hidden', 'h-screen']
    new_classes = [c for c in classes if c not in to_remove]
    if 'h-screen' in classes and 'min-h-screen' not in new_classes:
        new_classes.append('min-h-screen')
    return f'<{tag_name} class="{" ".join(new_classes)}"'

for html_file in html_files:
    if not os.path.exists(html_file):
        print(f"Skipping {html_file}, not found")
        continue

    with open(html_file, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the main wrapper div
    # Target <body ...> and <div ...> specifically that wrap the layout
    # Using regex to target <body class="...">
    content = re.sub(r'<(body)\s+class="([^"]*)"', remove_classes, content)
    # Target <div class="dashboard-layout ...">
    content = re.sub(r'<(div)\s+class="([^"]*dashboard-layout[^"]*)"', remove_classes, content)
    # Target <div class="flex h-screen overflow-hidden ..."> (if dashboard-layout isn't used)
    content = re.sub(r'<(div)\s+class="([^"]*flex\s+h-screen\s+overflow-hidden[^"]*)"', remove_classes, content)

    # Inject header after body
    # Using regex to find <body ...>
    if 'id="mainHeader"' not in content:
        content = re.sub(r'(<body[^>]*>)', r'\1\n' + HTML_HEADER, content, count=1)

    # Comment out old sidebar
    # Find <aside class="sidebar left-sidebar..."> ... </aside>
    aside_match = re.search(r'(<aside[^>]*\b(?:sidebar|nav-sidebar)[^>]*>.*?</aside>)', content, flags=re.DOTALL | re.IGNORECASE)
    if not aside_match:
        # Also try just any aside if the above didn't match and not right-sidebar config
        aside_match = re.search(r'(<aside[^>]*id="sidebar"[^>]*>.*?</aside>)', content, flags=re.DOTALL | re.IGNORECASE)
        
    if aside_match:
        aside_html = aside_match.group(1)
        if "<!-- OLD SIDEBAR — DO NOT DELETE" not in aside_html:
            commented_aside = f"<!-- OLD SIDEBAR — DO NOT DELETE\n{aside_html}\n-->"
            content = content.replace(aside_html, commented_aside)

    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print(f"Updated {html_file}")
