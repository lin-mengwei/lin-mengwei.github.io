# The BESTEPS Guide: regenerating the web edition

The pages under `/besteps/guide/` are generated from the book's LaTeX source in Overleaf
(`Print.tex`). Never edit the generated files by hand; change the LaTeX and re-run the script.

## After the book changes in Overleaf

1. Let Dropbox sync the Overleaf project (or download it), then run from the repository root:

   ```
   python scripts/build_guide.py "C:\Users\51585\Dropbox\应用\Overleaf\BESTEPS Lectures (Copy_Mw)"
   ```

   Add `--cover "<path to the cover PDF>"` only when the cover itself changed.
2. The script prints a table of headings, figures, footnotes, tables and lists per chapter, then
   `OK: all checks passed`. Any `FAIL:` line means something did not convert; fix the LaTeX and re-run.
3. If the text changed, also recompile the PDF in Overleaf and replace
   `assets/files/BESTEPS_Guide_Content.pdf` (the script warns when that PDF is older than `Print.tex`).
4. Preview with `bundle exec jekyll serve` and open `http://localhost:4000/besteps/guide/`, then commit.

## What is generated

| Output | Content |
|---|---|
| `_guide/*.html` | one page per chapter (Jekyll collection `guide`) |
| `_data/besteps_guide.yml` | home-page text: title-page blurb, acknowledgements, volume introductions |
| `assets/data/besteps-guide-search.json` | search index, one entry per section |
| `assets/images/besteps-guide/` | figures (resized for the web), UBSE logo, cover |

`_data/besteps_guide_people.yml` is the one hand-maintained input: lecturer names as spelled on the
cover and their short affiliations. The script fails if a lecturer in the book is missing there.

Only `Print.tex` is read. `Part 1.tex`, `Part 2.tex` and `Individuals/` are older versions and are ignored.

## Lecture photos

Chapter pages show the lecturer's photo from the BESTEPS lecture poster when one is available.

1. Save the posters in `assets/images/besteps-guide-photos/posters/` (excluded from the published site),
   named by chapter (`opening-lecture`, `lecture-1` … `lecture-5`, `closing-lecture`) or with the publicity
   names `pic_BESTEPS_open`, `_idea`, `_org`, `_vis`, `_talk`, `_jmp`, `_close` (`.jpg`, `.png` or `.webp`). The posters number two lectures differently from the book: the
   Ruiz-Valenzuela poster ("Lecture 5" on the poster) is the book's `lecture-4`, and the Glitz poster
   ("Lecture 4") is `lecture-5`.
2. Run `python scripts/guide_photos.py`. It crops the photo area of each poster (the boxes are at the top of
   the script) and writes the photos plus `_data/besteps_guide_photos.yml`.

## Home-page diagram

The diagram is drawn in draw.io. After editing it, export it as SVG to `besteps/guide/besteps.drawio.svg`
and run `python scripts/guide_flow.py`. It writes `_includes/guide-flow.svg`: the draw.io editor data and
PNG fallbacks removed, colours fixed to the light version, and each lecture's label and arrow (each volume's
label and brace) turned into a link. The links are found by draw.io cell number (`LINKS` in the script); if a
label no longer reads as expected the script stops with an error instead of linking the wrong page.

Other hand-maintained files: `besteps/guide/volume-1.md`, `volume-2.md`, `acknowledgements.md` (their text
comes from `Print.tex`).

## Requirements

Python 3.10+ with `beautifulsoup4`, `lxml`, `PyYAML`, `Pillow`, `PyMuPDF`; `pandoc` 3.x on the PATH.
Tests: `python -m pytest scripts/tests`.
