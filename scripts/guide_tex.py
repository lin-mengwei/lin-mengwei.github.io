"""Read The BESTEPS Guide's Print.tex, split it into chapters, and clean the LaTeX for pandoc."""
from __future__ import annotations

import re
from dataclasses import dataclass
from pathlib import Path


@dataclass
class Chapter:
    slug: str
    label: str      # "Lecture 1", "Opening Lecture", "Preface"
    title: str      # "Starting a Feasible and Promising Project"
    order: int
    volume: int | None
    tex: str


VOLUME_OF = {"opening-lecture": 1, "lecture-1": 1, "lecture-2": 1,
             "lecture-3": 2, "lecture-4": 2, "lecture-5": 2, "closing-lecture": 2}

SECTION_RE = re.compile(r"^\\section(\*)?(?:\[([^\]]*)\])?\{", re.M)


def read_source(path: Path) -> str:
    path = Path(path)
    if path.is_dir():
        path = path / "Print.tex"
    return path.read_text(encoding="utf-8")


def matching_brace(s: str, open_idx: int) -> int:
    """Index of the '}' matching the '{' at open_idx (backslash-escaped braces ignored)."""
    depth = 0
    i = open_idx
    while i < len(s):
        ch = s[i]
        if ch == "\\":
            i += 2
            continue
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return i
        i += 1
    raise ValueError(f"unbalanced brace at {open_idx}")


def replace_command(s: str, pattern: str, fn) -> str:
    """Replace every `pattern{arg}` (pattern is a regex ending just before '{') with fn(arg)."""
    rx = re.compile(pattern + r"\{")
    out, pos = [], 0
    while True:
        m = rx.search(s, pos)
        if not m:
            out.append(s[pos:])
            return "".join(out)
        open_idx = m.end() - 1
        close = matching_brace(s, open_idx)
        out.append(s[pos:m.start()])
        out.append(fn(s[open_idx + 1:close]))
        pos = close + 1


def drop_unmatched_braces(s: str) -> tuple[str, list[str]]:
    """Remove '{' that never close (LaTeX tolerates them, pandoc does not); report each with context."""
    stack, i, bad = [], 0, []
    while i < len(s):
        ch = s[i]
        if ch == "\\":
            i += 2
            continue
        if ch == "{":
            stack.append(i)
        elif ch == "}" and stack:
            stack.pop()
        i += 1
    for pos in reversed(stack):
        bad.append(s[pos:pos + 60].split("\n")[0])
        s = s[:pos] + s[pos + 1:]
    return s, list(reversed(bad))


WARNINGS: list[str] = []


def strip_comments(s: str) -> str:
    return re.sub(r"(?<!\\)%.*$", "", s, flags=re.M)


def _slug_and_label(heading: str) -> tuple[str, str, str]:
    """('lecture-1', 'Lecture 1', 'Starting a ...') from 'Lecture 1: Starting a ...'."""
    heading = re.sub(r"\s+", " ", heading.replace("\\\\", " ")).strip()
    if ":" in heading:
        label, title = (p.strip() for p in heading.split(":", 1))
    else:
        label = title = heading
    return label.lower().replace(" ", "-"), label, title


def split_book(src: str) -> tuple[list[Chapter], dict[str, str]]:
    src = strip_comments(src)
    frags = _fragments(src)
    body_start = src.index("\\tableofcontents")
    body_end = src.index("\\end{document}")
    body = src[body_start:body_end]
    for n in (1, 2):
        body = _remove_volume_block(body, n)

    starts = [m for m in SECTION_RE.finditer(body)]
    chapters = []
    for i, m in enumerate(starts):
        open_idx = m.end() - 1
        close = matching_brace(body, open_idx)
        heading = m.group(2) or body[open_idx + 1:close]
        end = starts[i + 1].start() if i + 1 < len(starts) else len(body)
        slug, label, title = _slug_and_label(heading)
        chapters.append(Chapter(slug, label, title, i + 1, VOLUME_OF.get(slug), body[close + 1:end]))
    return chapters, frags


def _block_after(src: str, start_marker: str, end_marker: str, at: int = 0) -> tuple[int, int]:
    s = src.index(start_marker, at) + len(start_marker)
    return s, src.index(end_marker, s)


def _fragments(src: str) -> dict[str, str]:
    frags: dict[str, str] = {}
    tp = src.index("\\begin{titlepage}")
    s = src.index("\\vspace{6em}", tp) + len("\\vspace{6em}")
    frags["blurb"] = src[s:src.index("\\begin{figure}", s)].strip()
    s, e = _block_after(src, "\\section*{Acknowledgements}", "\\end{minipage}")
    frags["acknowledgements"] = src[s:e].strip()
    for n in (1, 2):
        lab = src.index(f"\\label{{vol{n}}}")
        frags[f"volume{n}_title"] = re.search(r"\\Large\s*\\textit\{([^}]*)\}", src[lab:]).group(1).strip()
        s, e = _block_after(src, "\\begin{minipage}{\\textwidth}", "\\end{minipage}", lab)
        frags[f"volume{n}_intro"] = src[s:e].strip()
    return frags


def _remove_volume_block(body: str, n: int) -> str:
    lab = body.index(f"\\label{{vol{n}}}")
    start = body.rfind("\\phantomsection", 0, lab)
    end = body.index("\\end{center}", body.index("\\end{minipage}", lab)) + len("\\end{center}")
    return body[:start] + body[end:]


_DROP_CMDS = [
    r"\\newpage\b", r"\\clearpage\b", r"\\null\b", r"\\noindent\b", r"\\indent\b",
    r"\\phantomsection\b", r"\\small\b", r"\\bigskip\b", r"\\medskip\b", r"\\hfill\b",
    r"\\centering\b", r"\\thispagestyle\{[^}]*\}", r"\\pagestyle\{[^}]*\}",
    r"\\pagenumbering\{[^}]*\}", r"\\setcounter\{[^}]*\}\{[^}]*\}", r"\\vspace\*?\{[^}]*\}",
    r"\\hspace\*?\{[^}]*\}", r"\\enlargethispage\*?\{[^}]*\}", r"\\nopagebreak(\[\d\])?",
    r"\\addcontentsline\{[^}]*\}\{[^}]*\}\{[^}]*\}",
]


def preprocess(tex: str) -> str:
    tex = strip_comments(tex)
    tex, bad = drop_unmatched_braces(tex)
    WARNINGS.extend(f"unclosed '{{' in source, removed: {b}" for b in bad)
    tex = _outside_verbatim(tex, _fix_quotes)
    tex = re.sub(r"\\begin\{tikzpicture\}.*?\\end\{tikzpicture\}", "", tex, flags=re.S)
    tex = re.sub(r"\\begin\{CJK\*?\}\{[^}]*\}\{[^}]*\}(.*?)\\end\{CJK\*?\}", r"\1", tex, flags=re.S)
    for rx in _DROP_CMDS:
        tex = re.sub(rx, "", tex)
    tex = tex.replace("$^\\circ$", "°").replace("$\\rightarrow$", "→").replace("$0$", "0")
    tex = re.sub(r"\\\\\[[^\]]*\]", r"\\\\", tex)
    # "\\" closing a paragraph makes pandoc merge it with the next one; a blank line is the break.
    tex = re.sub(r"\\\\[ \t]*\n(?=[ \t]*(\n|\\begin\{|\\(sub)*section|\\paragraph|$))", "\n", tex)
    tex = re.sub(r"\\\\[ \t]*$", "", tex)
    tex = replace_command(tex, r"\\makebox(?:\[[^\]]*\])*", lambda a: a)
    tex = replace_command(tex, r"\\VTHREE", lambda a: a)
    tex = replace_command(tex, r"\\textcolor(?:\[[^\]]*\])?\{[^}]*\}", lambda a: f"⟦blue⟧{a}⟦/blue⟧")
    tex = replace_command(tex, r"\\begin\{tabularx\}\{[^}]*\}",
                          lambda spec: "\\begin{tabular}{" + spec.replace("@{}", "").replace("X", "l") + "}")
    tex = tex.replace("\\end{tabularx}", "\\end{tabular}")
    tex = replace_command(tex, r"\\caption\*", lambda a: "\\caption{⟦nonum⟧" + a + "}")
    tex = re.sub(r"\\begin\{figure\}.*?\\end\{figure\}", _minipages_to_subfigures, tex, flags=re.S)
    return tex


def _outside_verbatim(tex: str, fn) -> str:
    parts = re.split(r"(\\begin\{verbatim\}.*?\\end\{verbatim\})", tex, flags=re.S)
    return "".join(p if i % 2 else fn(p) for i, p in enumerate(parts))


def _fix_quotes(tex: str) -> str:
    """``text" ends with a straight quote that LaTeX prints curly; pandoc would keep it straight."""
    return re.sub(r"``((?:(?!'')[^`\"])*?)(?<!\\)\"", r"``\1''", tex)


def _minipages_to_subfigures(m: re.Match) -> str:
    fig = re.sub(r"\\begin\{minipage\}(?:\[[^\]]*\])?\{([^}]*)\}", r"\\begin{subfigure}{\1}", m.group(0))
    return fig.replace("\\end{minipage}", "\\end{subfigure}")


def image_widths(tex: str) -> dict[str, float | None]:
    """basename -> width as a fraction of the line (None when only a height is given)."""
    out: dict[str, float | None] = {}
    for opts, path in re.findall(r"\\includegraphics(?:\[([^\]]*)\])?\{([^}]*)\}", tex):
        m = re.search(r"width\s*=\s*([\d.]*)\s*\\(?:line|text)width", opts or "")
        out[Path(path).name] = (float(m.group(1) or 1.0)) if m else None
    return out


def lecturer_names(tex: str) -> list[str]:
    m = re.search(r"Lecturers?:(.*?)\.", tex, flags=re.S)
    if not m:
        return []
    text = m.group(1).replace("\\&", "&")
    text = re.sub(r"\\[a-zA-Z]+", "", text).replace("{", "").replace("}", "")
    return [n.strip() for n in re.split(r"&| and ", text) if n.strip()]
