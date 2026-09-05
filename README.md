# myggc.github.io

Website of the Georgian Game Community. Plain HTML, CSS and JavaScript. No build step,
no framework, no dependencies to install.

Live at https://myggc.github.io

## What is where

| Path | What it is |
|---|---|
| `index.html` | Home page |
| `about.html` | Who we are, what we have done, the team |
| `companies.html` | Companies and teams directory |
| `developers.html` | Solo developers directory |
| `contact.html` | Address, phones, email, socials |
| `admin.html` | Content tool — builds data files and crops images |
| `404.html` | Shown for a wrong address |
| `assets/css/site.css` | All styling |
| `assets/js/i18n.js` | **All the wording, in Georgian and English** |
| `assets/js/site.js` | Header, footer, language switch, Telegram button |
| `assets/js/directory.js` | Directory listing and filters |
| `data/companies.json` | The companies and teams list |
| `data/developers.json` | The solo developers list |
| `assets/logos/` | Logos and photos |

## Changing the wording

Every visible sentence lives in `assets/js/i18n.js`, once in `ka` and once in `en`.
Edit the text there, commit, and it changes on the site. Do not edit text inside the
HTML files.

The team list is at the bottom of `about.html`.

## Adding a company, team, or developer

1. Open https://myggc.github.io/admin.html
2. Pick the tab you need, then **Load from the live site**
3. Fill in the entry and press **Add / update entry**
4. In section 3, pick the logo, drag and zoom to frame it, press
   **Crop, compress & download**
5. In section 4, press **Download .json**
6. Upload both files to the repository:
   - the image goes in `assets/logos/`
   - the `.json` goes in `data/`, replacing the old one
7. The site updates about a minute later

The tool does not save anything by itself. It only produces the two files.

## Rules that matter

- **Nothing secret goes in this repository.** It is public, and everything the site
  serves can be downloaded by anyone. No passwords, no API keys, no private contact
  details of members.
- **File names are case-sensitive.** `Logo.png` and `logo.png` are different files.
  Keep everything lowercase.
- Images should go through the admin tool. A 4 MB phone photo will make the page slow;
  the tool turns it into roughly 30–60 KB.

## Adding a new filter option

Open `assets/js/i18n.js` and find `TAXONOMY` near the bottom. Add a line in the right
group with a Georgian and an English label. It appears in the filters, on the cards, and
in the admin tool automatically.
