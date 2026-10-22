from guide_tex import lecturer_names, preprocess, split_book


def test_split_book_order(real_source):
    chapters, _ = split_book(real_source)
    assert [c.slug for c in chapters] == [
        "preface", "opening-lecture", "lecture-1", "lecture-2", "lecture-3",
        "lecture-4", "lecture-5", "closing-lecture", "afterword",
    ]
    assert [c.order for c in chapters] == list(range(1, 10))
    by = {c.slug: c for c in chapters}
    assert by["opening-lecture"].label == "Opening Lecture"
    assert by["opening-lecture"].title == "Navigating the Research Process in Economics"
    assert by["closing-lecture"].title == "Research Products in Economics"
    assert by["lecture-1"].label == "Lecture 1"
    assert by["lecture-1"].title == "Starting a Feasible and Promising Project"
    assert by["preface"].title == "Preface" and by["preface"].volume is None
    assert by["opening-lecture"].volume == 1 and by["lecture-2"].volume == 1
    assert by["lecture-3"].volume == 2 and by["closing-lecture"].volume == 2
    assert by["afterword"].volume is None


def test_volume_fragments_removed_from_chapters(real_source):
    chapters, frags = split_book(real_source)
    for c in chapters:
        assert "VOLUME ONE" not in c.tex and "VOLUME TWO" not in c.tex
    assert frags["volume1_title"] == "Set Up Your Research Project"
    assert frags["volume2_title"] == "Produce and Communicate Your Research"
    assert "foundational phase" in frags["volume1_intro"]
    assert "Building on the foundations laid in Volume 1" in frags["volume2_intro"]
    assert "intended to offer early-career economists" in frags["blurb"]
    assert "Bastian Bruestle" in frags["acknowledgements"]
    assert "@ub.edu" not in "".join(frags.values())


def test_preprocess_strips_scaffolding():
    tex = (
        "\\newpage\n\\clearpage\n\\null\n\\thispagestyle{empty}\n\\vspace*{2cm}\n"
        "\\enlargethispage*{22pt}\n\\phantomsection\n\\addcontentsline{toc}{section}{X}\n"
        "\\setcounter{section}{3}\n\\pagestyle{fancy}\n\\pagenumbering{arabic}\n"
        "\\noindent Text \\indent more\n"
        "\\begin{tikzpicture}[overlay]\n\\node {\\includegraphics{by-nd.png}};\n\\end{tikzpicture}\n"
    )
    out = preprocess(tex)
    for gone in ["newpage", "clearpage", "null", "thispagestyle", "vspace", "enlargethispage",
                 "phantomsection", "addcontentsline", "setcounter", "pagestyle", "pagenumbering",
                 "noindent", "\\indent", "tikzpicture", "by-nd.png"]:
        assert gone not in out, gone
    assert "Text" in out and "more" in out


def test_preprocess_inline():
    out = preprocess(
        "a 45$^\\circ$ angle $\\rightarrow$ $0$ "
        "\\makebox[\\textwidth][c]{%\n\\begin{tabular}{ll}\nx & y \\\\\n\\end{tabular}\n}\n"
        "\\begin{tabularx}{\\textwidth}{@{}lXX@{}}\na & b & c \\\\\n\\end{tabularx}\n"
        "Lin \\begin{CJK*}{UTF8}{gbsn}林孟蔚\\end{CJK*} "
        "restrained \\textcolor[RGB]{0, 90, 139}{\\textbf{use of color}} help"
    )
    assert "45° angle → 0" in out
    assert "makebox" not in out and "\\begin{tabular}{ll}" in out
    assert "\\begin{tabular}{lll}" in out and "tabularx" not in out
    assert "Lin 林孟蔚" in out and "CJK" not in out
    assert "⟦blue⟧\\textbf{use of color}⟦/blue⟧" in out


def test_minipage_pair_keeps_both_captions():
    tex = (
        "\\begin{figure}[htbp]\n\\centering\n"
        "\\begin{minipage}{0.45\\linewidth}\n\\includegraphics[height=5cm]{a.png}\n"
        "\\caption{Left}\n\\label{fig:a}\n\\end{minipage}\n\\hfill\n"
        "\\begin{minipage}[t]{0.45\\linewidth}\n\\includegraphics[height=5cm]{b.png}\n"
        "\\caption{Right}\n\\label{fig:b}\n\\end{minipage}\n\\end{figure}\n"
        "\\begin{center}\\begin{minipage}{\\textwidth}keep\\end{minipage}\\end{center}"
    )
    out = preprocess(tex)
    assert out.count("\\begin{subfigure}{0.45\\linewidth}") == 2
    assert out.count("\\end{subfigure}") == 2
    assert "\\begin{minipage}{\\textwidth}keep" in out


def test_paragraph_final_linebreak_removed():
    out = preprocess("One. \\\\\n\nTwo.\\\\ \n\\begin{itemize}\n\\item \\textbf{X}\\\\\nbody\n\\end{itemize}")
    assert "One. \n\nTwo.\n\\begin{itemize}" in out
    assert "\\textbf{X}\\\\\nbody" in out


def test_unclosed_brace_dropped():
    out = preprocess("\\noindent{\\textbf{2) Visual Encoding}\n\nNext paragraph.")
    assert out.count("{") == out.count("}")
    assert "\\textbf{2) Visual Encoding}" in out


def test_straight_closing_quote_paired_with_backticks():
    out = preprocess("the ``best steps\" at ``each'' and Mind the ``History Trap\". Verbatim:\n"
                     "\\begin{verbatim}\nx = ``a\"\n\\end{verbatim}\n")
    assert "``best steps'' at ``each'' and Mind the ``History Trap''." in out
    assert "x = ``a\"" in out


def test_caption_star_marked():
    assert "\\caption{⟦nonum⟧Results Table}" in preprocess("\\caption*{Results Table}")


def test_lecturer_names(real_source):
    chapters, _ = split_book(real_source)
    by = {c.slug: c for c in chapters}
    assert lecturer_names(by["lecture-1"].tex) == ["Libertad González"]
    assert lecturer_names(by["opening-lecture"].tex) == ["Antonio Cabrales"]
    assert lecturer_names(by["lecture-3"].tex) == ["Guillermo Marin", "Dirk Foremny"]
    assert lecturer_names(by["lecture-4"].tex) == ["Jenifer Ruiz-Valenzuela"]
    assert lecturer_names(by["preface"].tex) == []
