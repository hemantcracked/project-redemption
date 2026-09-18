# UPSC CSE Prep Tracker

A minimal, Hacker-News-styled static tracker for your sectional-test cycles,
exam countdowns, and answer-script PDFs. No backend, no build step - just
static files.

## Host it on GitHub Pages

1. Create a new GitHub repo (e.g. `upsc-tracker`), public or private-with-Pages-enabled.
2. Copy all files from this folder into the repo root (`index.html`, `style.css`,
   `script.js`, `pdfs/`, this `README.md`).
3. Commit and push.
4. In the repo: **Settings -> Pages -> Build and deployment -> Source: Deploy from a branch**,
   branch `main`, folder `/ (root)`. Save.
5. Your tracker will be live at `https://<your-username>.github.io/upsc-tracker/`
   within a minute or two.

## Adding your answer scripts

Each day's row has a default PDF path like `pdfs/c1/day01-ethics.pdf`. Scan or
export your answer script as a PDF, name it to match (or edit the path field
in the table to whatever you actually name it), and drop it into the matching
`pdfs/c1/`, `pdfs/c2/`, or `pdfs/c3/` folder. Commit and push - the "open" link
on that row will then open the PDF straight from your own GitHub Pages site.

## Exams

The "Exams" panel starts with the two exams from your notes (Engineering
Services - 31 Jan 2027, Civil Services Prelims - 23 May 2027). Add any others
you've applied for with the form; the countdown recalculates automatically
every day. Remove one with the `[remove]` link.

## Data storage

Your checkbox/status/remarks/PDF-path edits and added exams are saved in
`localStorage`, scoped to your own browser on this exact URL. Nothing is sent
anywhere. If you clear your browser data or switch browsers/devices, the
inputs reset to defaults - the PDFs themselves are safe either way since
they live in the repo, not in localStorage.

## Editing the plan

- Test-to-subject mapping and the day order live at the top of `script.js`
  (`subjects` and `priorityOrder`). Edit freely if your syllabus mapping changes.
- Test #29's topic was unclear in the source notes - it's marked "TBD"; update
  it in `script.js` once confirmed.
