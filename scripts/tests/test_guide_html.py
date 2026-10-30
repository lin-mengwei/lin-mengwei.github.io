from bs4 import BeautifulSoup

from guide_html import postprocess, slugify, to_html
from guide_tex import image_widths, preprocess


def run(tex: str, widths=None):
    return postprocess(to_html(preprocess(tex)), "lecture-9", widths or image_widths(tex))


def soup(ch):
    return BeautifulSoup(ch.html, "lxml")


def test_slugify():
    assert slugify("Step 1: Select a Field (or two)") == "step-1-select-a-field-or-two"
    assert slugify("Do’s and Don’ts — González") == "dos-and-donts-gonzalez"


def test_heading_ids_are_slugs():
    ch = run("\\subsection{Step 1: Select a Field (or two)}\n\\label{sub:x}\nText.\n")
    assert soup(ch).find("h2")["id"] == "step-1-select-a-field-or-two"
    assert ch.labels["sub:x"] == ("step-1-select-a-field-or-two", "Step 1: Select a Field (or two)", "section")


def test_duplicate_heading_ids_get_suffix():
    ch = run("\\subsection{Intro}\nA\n\\subsection{Intro}\nB\n")
    assert [h["id"] for h in soup(ch).find_all("h2")] == ["intro", "intro-2"]


def test_mid_section_label_maps_to_previous_heading():
    ch = run("\\subsection{Before the Talk}\nSome text.\\label{sub:prep} More.\n")
    assert ch.labels["sub:prep"][0] == "before-the-talk"
    assert soup(ch).find("span", id="sub:prep") is None


def test_sections_nested():
    ch = run("\\subsection{A}\nx\n\\subsubsection{A1}\ny\n\\subsubsection*{A2}\nz\n\\subsection{B}\nw\n")
    assert ch.sections == [
        {"id": "a", "title": "A", "children": [{"id": "a1", "title": "A1"}, {"id": "a2", "title": "A2"}]},
        {"id": "b", "title": "B", "children": []},
    ]


def test_paragraph_run_in():
    ch = run("\\subsection{A}\n\\paragraph{1) Hook and Question} There are two ways.\n")
    p = soup(ch).find("strong", class_="run-in").parent
    assert p.name == "p" and p.get_text().startswith("1) Hook and Question There are two ways")
    assert soup(ch).find("h4") is None
    assert ch.counts["runin"] == 1 and ch.sections[0]["children"] == []


FIG_PAIR_NO_CAPTION = (
    "\\begin{figure}[htbp]\n\\begin{minipage}{0.45\\linewidth}\n"
    "\\includegraphics[height=5cm]{figures_visualization/a.png}\n\\caption{Left}\n\\label{fig:a}\n"
    "\\end{minipage}\n\\begin{minipage}{0.45\\linewidth}\n"
    "\\includegraphics[height=5cm]{figures_visualization/b.png}\n\\caption{Right}\n\\label{fig:b}\n"
    "\\end{minipage}\n\\end{figure}\n"
)
FIG_GROUP_CAPTION = (
    "\\begin{figure}[htbp]\n\\begin{subfigure}{0.45\\textwidth}\n"
    "\\includegraphics[width=\\linewidth]{c.png}\n\\caption*{Results Table}\n\\label{fig:c}\n\\end{subfigure}\n"
    "\\begin{subfigure}{0.45\\textwidth}\n\\includegraphics[width=\\linewidth]{d.png}\n"
    "\\caption{Plot}\n\\label{fig:d}\n\\end{subfigure}\n"
    "\\caption{Marginal Effects}\n\\label{fig:group}\n\\end{figure}\n"
    "\\begin{figure}[htbp]\n\\includegraphics[width=0.5\\linewidth]{e.png}\n\\caption{Single}\n"
    "\\label{fig:e}\n\\end{figure}\n"
)


def test_figure_numbering_pairs():
    ch = run(FIG_PAIR_NO_CAPTION + FIG_GROUP_CAPTION)
    s = soup(ch)
    caps = [c.get_text(" ", strip=True) for c in s.find_all("figcaption")]
    assert caps == ["Figure 1. Left", "Figure 2. Right", "Results Table", "(b) Plot",
                    "Figure 3. Marginal Effects", "Figure 4. Single"]
    assert s.find("div", class_="figure-row") is not None
    assert ch.labels["fig:a"] == ("figure-1", "1", "figure")
    assert ch.labels["fig:group"] == ("figure-3", "3", "figure")
    assert ch.labels["fig:e"] == ("figure-4", "4", "figure")
    assert ch.counts["figures"] == 4 and "⟦" not in ch.html


def test_image_paths_and_sizes():
    ch = run(FIG_PAIR_NO_CAPTION + FIG_GROUP_CAPTION)
    imgs = soup(ch).find_all("img")
    assert imgs[0]["src"] == "/assets/images/besteps-guide/a.png"
    assert all(not i.get("style") for i in imgs)
    assert "fig-half" in imgs[-1]["class"]
    assert ch.images == ["a.png", "b.png", "c.png", "d.png", "e.png"]
    assert all(i.get("alt") for i in imgs)
    assert all(i.get("loading") == "lazy" for i in imgs)


def test_footnotes_section():
    ch = run("\\subsection{A}\nText\\footnote{A note.} here.\n")
    s = soup(ch)
    notes = s.find("section", class_="guide-notes")
    assert notes.find("h2", id="notes").get_text() == "Notes"
    assert notes.find("a", class_="footnote-back")
    assert s.find("aside") is None and ch.counts["footnotes"] == 1
    assert [x["id"] for x in ch.sections] == ["a"]


def test_tables_wrapped_and_numbered():
    ch = run("\\begin{table}\n\\caption{List}\n\\begin{tabular}{ll}\na & b \\\\\nc & d \\\\\n\\end{tabular}\n\\end{table}\n")
    t = soup(ch).find("table")
    assert t.parent.name == "div" and "table-scroll" in t.parent["class"]
    assert t.find("caption").get_text(" ", strip=True) == "Table 1. List"


def test_pre_kept():
    ch = run("\\begin{verbatim}\nroot/\n  ├── a\n\\end{verbatim}\n")
    pre = soup(ch).find("pre")
    assert "  ├── a" in pre.get_text() and "pre-scroll" in pre.parent["class"]


def test_trailing_br_removed_and_math_unwrapped():
    ch = run("First line \\\\\n\nAn arrow $\\Rightarrow$ here.\n")
    s = soup(ch)
    assert s.find("p").find("br") is None
    assert s.find("span", class_="math") is None


def test_blue_marker_becomes_span():
    ch = run("restrained \\textcolor[RGB]{0, 90, 139}{\\textbf{use of color}} help")
    span = soup(ch).find("span", class_="ubse-blue")
    assert span.get_text() == "use of color"


def test_description_skips_lecturer_bio():
    ch = run(
        "\\noindent\\textit{Lecturer: \\textbf{Libertad González}. Libertad is a Professor.} \\\\\n\n"
        "In this lecture, Professor González focuses on idea generation. \\\\\n\n"
        "\\noindent\\textbf{Contents of this lecture:}\n"
    )
    assert ch.description == "In this lecture, Professor González focuses on idea generation."


def test_search_entries():
    ch = run("Opening words.\n\\subsection{A}\nAlpha text.\n\\subsubsection{A1}\nBeta text.\n")
    assert [(e["anchor"], e["section"]) for e in ch.search] == [("", "Introduction"), ("a", "A"), ("a1", "A1")]
    assert ch.search[1]["text"] == "Alpha text."


def test_plain_text_has_no_space_before_punctuation_or_footnote_numbers():
    ch = run("In \\hyperref[sub:a]{Part 1}, the \\textbf{(BESTEPS)}, an idea\\footnote{Note.}.\n\n"
             "\\subsection{A}\n\\label{sub:a}\nx\n")
    assert ch.description == "In Part 1, the (BESTEPS), an idea."
    assert ch.search[0]["text"] == "In Part 1, the (BESTEPS), an idea."


def test_figure_group_without_labels_keeps_parent_caption():
    ch = run("\\begin{figure}\n\\begin{subfigure}{0.4\\textwidth}\n\\includegraphics{a.png}\n\\caption{A}\n"
             "\\end{subfigure}\n\\begin{subfigure}{0.4\\textwidth}\n\\includegraphics{b.png}\n\\caption{B}\n"
             "\\end{subfigure}\n\\caption{Parent}\n\\end{figure}\n")
    caps = [c.get_text(" ", strip=True) for c in soup(ch).find_all("figcaption")]
    assert caps == ["(a) A", "(b) B", "Figure 1. Parent"] and ch.counts["figures"] == 1


def test_image_outside_figure_gets_its_own_alt():
    ch = run("\\begin{figure}\n\\includegraphics{a.png}\n\\caption{First}\n\\end{figure}\n\n"
             "Text \\includegraphics{logo.png} here.\n")
    assert soup(ch).find_all("img")[1]["alt"] == "logo.png"


def test_search_keeps_late_text_in_long_sections():
    filler = "Words to pad this section well beyond any snippet length. " * 30
    ch = run("\\subsection{Managing Data}\n" + filler + "\n\nThe FAIR principles come last.\n")
    assert "FAIR principles" in ch.search[-1]["text"]


def test_pre_continuation_lines_joined():
    tex = ("\\begin{verbatim}\n"
           "├── 1_Data/\n"
           "│   ├── Raw/        # Downloaded, unaltered data (e.g. CPI indices, shapefiles\n"
           "                 , surveys)\n"
           "│   └── Cleaned/    # Final datasets\n"
           "\\end{verbatim}\n")
    text = soup(run(tex)).find("pre").get_text()
    assert "# Downloaded, unaltered data (e.g. CPI indices, shapefiles, surveys)" in text
    assert "\n│   └── Cleaned/" in text and text.count("\n") == 2
