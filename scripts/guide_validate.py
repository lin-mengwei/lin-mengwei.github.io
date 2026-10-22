"""Checks run after generation; every function returns a list of failure messages."""
from __future__ import annotations

import re
from pathlib import Path

from bs4 import BeautifulSoup

from guide_tex import strip_comments

GUIDE_URL = "/besteps/guide/"


def _figure_count(tex: str) -> int:
    n = 0
    for env in re.findall(r"\\begin\{figure\}.*?\\end\{figure\}", tex, flags=re.S):
        subs = re.findall(r"\\begin\{(?:subfigure|minipage)\}.*?\\end\{(?:subfigure|minipage)\}", env, flags=re.S)
        outside = re.sub(r"\\begin\{(subfigure|minipage)\}.*?\\end\{(subfigure|minipage)\}", "", env, flags=re.S)
        own = len(re.findall(r"\\caption\{", outside))
        if subs and not own:
            n += sum(len(re.findall(r"\\caption\{", s)) for s in subs)
        else:
            n += own
    return n


def source_counts(tex: str) -> dict[str, int]:
    tex = strip_comments(tex)
    return {
        "h2": len(re.findall(r"\\subsection\*?[\[{]", tex)),
        "h3": len(re.findall(r"\\subsubsection\*?[\[{]", tex)),
        "runin": len(re.findall(r"\\paragraph\*?\{", tex)),
        "figures": _figure_count(tex),
        "images": len(re.findall(r"\\includegraphics", re.sub(r"\\begin\{tikzpicture\}.*?\\end\{tikzpicture\}", "", tex, flags=re.S))),
        "footnotes": len(re.findall(r"\\footnote\{", tex)),
        "tables": len(re.findall(r"\\begin\{tabularx?\}", tex)),
        "pre": len(re.findall(r"\\begin\{verbatim\}", tex)),
        "lists": len(re.findall(r"\\begin\{(?:itemize|enumerate)\}", tex)),
    }


def check_counts(slug: str, src: dict[str, int], out: dict[str, int]) -> list[str]:
    return [f"{slug}: {k} source={src[k]} output={out.get(k, 0)}" for k in src if src[k] != out.get(k, 0)]


def check_text(slug: str, html: str) -> list[str]:
    s = BeautifulSoup(html, "lxml")
    for el in s.find_all(["pre", "code"]):
        el.decompose()
    text = s.get_text(" ")
    bad = []
    for pat, what in [(r"\\[a-zA-Z]+", "LaTeX command"), (r"[{}]", "brace"), (r"⟦|⟧", "marker"), (r"\?\?", "'??'")]:
        for m in re.finditer(pat, text):
            bad.append(f"{slug}: residual {what} {text[max(0, m.start() - 30):m.end() + 30]!r}")
    for a in BeautifulSoup(html, "lxml").find_all("a"):
        if not a.get_text(strip=True) and not a.find("img"):
            bad.append(f"{slug}: empty link {a.get('href')}")
    return bad


def check_links(pages: dict[str, str]) -> list[str]:
    ids = {slug: {el["id"] for el in BeautifulSoup(h, "lxml").find_all(id=True)} for slug, h in pages.items()}
    bad = []
    for slug, html in pages.items():
        for a in BeautifulSoup(html, "lxml").find_all("a", href=True):
            href = a["href"]
            if href.startswith("#"):
                if href[1:] not in ids[slug]:
                    bad.append(f"{slug}: broken link {href}")
            elif href.startswith(GUIDE_URL):
                target, _, anchor = href[len(GUIDE_URL):].partition("#")
                target = target.strip("/")
                if target not in ids or (anchor and anchor not in ids[target]):
                    bad.append(f"{slug}: broken link {href}")
    return bad


def check_images(names: list[str], img_dir: Path) -> list[str]:
    return [f"missing image: {n}" for n in names if not (Path(img_dir) / n).exists()]
