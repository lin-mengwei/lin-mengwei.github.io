"""Convert one preprocessed chapter to HTML with pandoc and shape it for the web edition."""
from __future__ import annotations

import copy
import re
import subprocess
import unicodedata
from dataclasses import dataclass, field

from bs4 import BeautifulSoup, NavigableString, Tag

IMG_BASE = "/assets/images/besteps-guide/"


@dataclass
class ChapterHTML:
    html: str
    sections: list[dict]
    labels: dict[str, tuple[str, str, str]]   # label -> (anchor id, display text, kind)
    counts: dict[str, int]
    images: list[str]
    search: list[dict]
    description: str
    ref_links: list[str] = field(default_factory=list)


def to_html(tex: str) -> str:
    r = subprocess.run(["pandoc", "-f", "latex", "-t", "html5", "--wrap=none"],
                       input=tex, capture_output=True, text=True, encoding="utf-8")
    if r.returncode != 0:
        raise RuntimeError(f"pandoc failed: {r.stderr.strip()}")
    return r.stdout


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode()
    text = re.sub(r"['’`]", "", text.lower())
    return re.sub(r"[^a-z0-9]+", "-", text).strip("-") or "section"


_BLOCKS = ["p", "li", "ul", "ol", "h1", "h2", "h3", "h4", "figure", "figcaption", "div", "blockquote",
           "pre", "table", "caption", "tr", "td", "th", "section"]


def _plain(el) -> str:
    """Readable plain text: no footnote markers, spaces only between blocks, never before punctuation."""
    el = copy.copy(el)
    for x in el.select("a.footnote-ref"):
        x.decompose()
    for br in el.find_all("br"):
        br.replace_with(" ")
    for b in el.find_all(_BLOCKS):
        b.append(" ")
    return re.sub(r"\s+", " ", el.get_text("")).strip()


def postprocess(html: str, slug: str, widths: dict[str, float | None]) -> ChapterHTML:
    html = html.replace("⟦blue⟧", '<span class="ubse-blue">').replace("⟦/blue⟧", "</span>")
    s = BeautifulSoup(f"<div id='root'>{html}</div>", "lxml")
    root = s.find("div", id="root")
    labels: dict[str, tuple[str, str, str]] = {}
    counts = {"h2": 0, "h3": 0, "runin": 0, "figures": 0, "images": 0, "footnotes": 0,
              "tables": 0, "pre": 0, "lists": 0}

    for h1 in root.find_all("h1"):
        h1.decompose()
    for span in root.find_all("span"):
        cls = span.get("class") or []
        if "math" in cls or not span.attrs:
            span.unwrap()
    for div in root.find_all("div", class_="center"):
        div.unwrap()

    _run_in_headings(s, root, counts)
    sections = _headings(root, labels, counts)
    _figures(s, root, labels, counts, widths)
    images = _images(root, counts, widths)
    _tables(s, root, counts)
    _blocks(s, root, counts)
    _footnotes(s, root, counts)
    _tidy_paragraphs(root)

    description = _description(root)
    search = _search_entries(root)
    ref_links = [a["href"][1:] for a in root.find_all("a", href=True)
                 if a["href"].startswith("#") and not a["href"].startswith(("#fn", "#notes"))]
    inner = "".join(str(c) for c in root.contents).strip()
    return ChapterHTML(inner, sections, labels, counts, images, search, description, ref_links)


def _run_in_headings(s, root, counts):
    for h4 in root.find_all("h4"):
        nxt = h4.find_next_sibling()
        strong = s.new_tag("strong", attrs={"class": "run-in"})
        strong.string = h4.get_text()
        if nxt is not None and nxt.name == "p":
            nxt.insert(0, NavigableString(" "))
            nxt.insert(0, strong)
            h4.decompose()
        else:
            p = s.new_tag("p")
            p.append(strong)
            h4.replace_with(p)
        counts["runin"] += 1


def _headings(root, labels, counts) -> list[dict]:
    used: set[str] = {"notes"}
    sections: list[dict] = []
    current = None
    for el in root.find_all(["h2", "h3", "span"]):
        if el.name == "span":
            if el.get("id") and current is not None:
                labels[el["id"]] = (current[0], current[1], "section")
                el.unwrap() if el.contents else el.decompose()
            continue
        title = _plain(el)
        base = slugify(title)
        new, n = base, 2
        while new in used:
            new, n = f"{base}-{n}", n + 1
        used.add(new)
        old = el.get("id", "")
        if ":" in old:
            labels[old] = (new, title, "section")
        el["id"] = new
        current = (new, title)
        counts[el.name] += 1
        entry = {"id": new, "title": title}
        if el.name == "h2" or not sections:
            sections.append({**entry, "children": []})
        else:
            sections[-1]["children"].append(entry)
    return sections


def _caption_text(fig: Tag) -> str:
    cap = fig.find("figcaption", recursive=False)
    return _plain(cap) if cap else ""


def _number_caption(s, cap: Tag, prefix: str):
    span = s.new_tag("span", attrs={"class": "fig-num"})
    span.string = prefix
    cap.insert(0, NavigableString(" "))
    cap.insert(0, span)


def _strip_nonum(cap: Tag | None) -> bool:
    if cap is None:
        return False
    for t in cap.find_all(string=re.compile("⟦nonum⟧")):
        t.replace_with(t.replace("⟦nonum⟧", ""))
        return True
    return False


def _figures(s, root, labels, counts, widths):
    n = 0

    def number(fig: Tag, cap: Tag | None):
        nonlocal n
        old = fig.get("id")
        if _strip_nonum(cap) or cap is None:
            if cap is not None:
                cap["class"] = ["nonum"]
            if old:
                del fig["id"]
            return
        n += 1
        _number_caption(s, cap, f"Figure {n}.")
        fig["id"] = f"figure-{n}"
        if old:
            labels[old] = (f"figure-{n}", str(n), "figure")

    for fig in [f for f in root.find_all("figure") if f.find_parent("figure") is None]:
        children = fig.find_all("figure", recursive=False)
        cap = fig.find("figcaption", recursive=False)
        if not children:
            number(fig, cap)
            continue
        child_ids = {c.get("id") for c in children} - {None}
        own_caption = cap is not None and fig.get("id") not in child_ids and \
            _caption_text(fig) != _caption_text(children[-1])
        row = s.new_tag("div", attrs={"class": "figure-row"})
        for c in children:
            row.append(c.extract())
        if own_caption:
            fig.insert(0, row)
            for letter, c in zip("abcdefgh", children):
                ccap = c.find("figcaption", recursive=False)
                if c.get("id"):
                    labels[c["id"]] = ("", "", "subfigure")  # resolved to the parent below
                if ccap is not None and not _strip_nonum(ccap):
                    _number_caption(s, ccap, f"({letter})")
                elif ccap is not None:
                    ccap["class"] = ["nonum"]
                c.name = "div"
                c["class"] = ["subfigure"]
                c.attrs.pop("id", None)
            number(fig, cap)
            for c_label, v in list(labels.items()):
                if v == ("", "", "subfigure"):
                    labels[c_label] = (fig.get("id", ""), str(n), "figure")
        else:
            if cap is not None:
                cap.decompose()
            fig.replace_with(row)
            for c in children:
                number(c, c.find("figcaption", recursive=False))
    counts["figures"] = n


def _images(root, counts, widths) -> list[str]:
    names = []
    for img in root.find_all("img"):
        name = img["src"].replace("\\", "/").rsplit("/", 1)[-1]
        names.append(name)
        img["src"] = IMG_BASE + name
        img.attrs.pop("style", None)
        fig = img.find_parent(lambda t: t.name == "figure" or "subfigure" in (t.get("class") or []))
        cap = fig.find("figcaption") if fig else None
        img["alt"] = re.sub(r"^(Figure \d+\.|\([a-h]\))\s*", "", _plain(cap)) if cap else name
        img["loading"] = "lazy"
        if img.find_parent("div", class_="figure-row") is None:
            w = widths.get(name)
            img["class"] = ["fig-full" if w is None or w >= 0.8 else "fig-wide" if w >= 0.55 else "fig-half"]
        counts["images"] += 1
    return names


def _tables(s, root, counts):
    for t in root.find_all("table"):
        counts["tables"] += 1
        cap = t.find("caption")
        if cap is not None:
            span = s.new_tag("span", attrs={"class": "fig-num"})
            span.string = f"Table {counts['tables']}."
            cap.insert(0, NavigableString(" "))
            cap.insert(0, span)
        for cell in t.find_all(["th", "td"]):
            cell.attrs.pop("style", None)
        t.wrap(s.new_tag("div", attrs={"class": "table-scroll"}))


TREE_GLYPHS = set("│├└─┬┼")


def join_wrapped_comments(text: str) -> str:
    """Rejoin comment lines that were hard-wrapped only to fit the PDF page: a line with no tree glyphs that
    starts with spaces, right after a line holding a '#' comment, continues that comment."""
    out: list[str] = []
    for line in text.split("\n"):
        if out and "#" in out[-1] and line[:1] == " " and line.strip() and not (set(line) & TREE_GLYPHS):
            cont = line.strip()
            out[-1] = out[-1].rstrip() + ("" if cont[:1] in ",.;:)" else " ") + cont
        else:
            out.append(line)
    return "\n".join(out)


def _blocks(s, root, counts):
    for pre in root.find_all("pre"):
        code = pre.find("code") or pre
        if code.string:
            code.string.replace_with(join_wrapped_comments(str(code.string)))
        counts["pre"] += 1
        pre.wrap(s.new_tag("div", attrs={"class": "pre-scroll"}))
    counts["lists"] = len(root.find_all(["ul", "ol"])) - len(root.select("aside ol"))


def _footnotes(s, root, counts):
    aside = root.find("aside", class_="footnotes")
    if aside is None:
        return
    sec = s.new_tag("section", attrs={"class": "guide-notes"})
    h = s.new_tag("h2", attrs={"id": "notes", "class": "guide-notes-title"})
    h.string = "Notes"
    sec.append(h)
    ol = aside.find("ol")
    counts["footnotes"] = len(ol.find_all("li", recursive=False))
    sec.append(ol.extract())
    aside.replace_with(sec)


def _tidy_paragraphs(root):
    for p in root.find_all(["p", "li"]):
        while True:
            last = p.contents[-1] if p.contents else None
            if isinstance(last, NavigableString) and not last.strip():
                last.extract()
                continue
            if isinstance(last, Tag) and last.name == "br":
                last.decompose()
                continue
            break
        if p.name == "p" and not p.get_text(strip=True) and not p.find(["img", "a"]):
            p.decompose()


def _description(root) -> str:
    for p in root.find_all("p", recursive=False):
        text = _plain(p)
        if not text or text.startswith(("Lecturer", "Contents of")):
            continue
        ems = "".join(_plain(e) for e in p.find_all("em", recursive=False))
        if ems and len(ems) >= len(text) - 2:
            continue
        return text
    return ""


def _search_entries(root) -> list[dict]:
    entries = [{"anchor": "", "section": "Introduction", "text": []}]
    for el in root.children:
        if not isinstance(el, Tag):
            continue
        if el.name == "section":
            break
        if el.name in ("h2", "h3"):
            entries.append({"anchor": el["id"], "section": _plain(el), "text": []})
        else:
            entries[-1]["text"].append(_plain(el))
    out = []
    for e in entries:
        text = re.sub(r"\s+", " ", " ".join(e["text"])).strip()
        if e["anchor"] or text:
            out.append({**e, "text": text})
    return out
