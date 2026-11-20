"""Check the SEO head tags, robots.txt and sitemap of a built site.

Usage: python scripts/check_seo.py <site_dir>

<site_dir> is the output of `bundle exec jekyll build -d <site_dir>`.
Exits 1 and prints every failed check. Expected texts are the ones agreed in
docs/superpowers/specs/2026-11-20-seo-name-search-design.md (section 5.2);
when a title or description changes on purpose, change it here too.
"""
import html
import json
import re
import sys
import xml.etree.ElementTree as ET
from pathlib import Path

ORIGIN = "https://lin-mengwei.github.io"
NAME = "Mengwei Lin 林孟蔚"
HOME_DESC = (
    "Mengwei Lin (林孟蔚) is a PhD candidate in Economics at the University of Barcelona and IEB. "
    "He works on education, urban and cultural economics. On the 2026/27 job market."
)
JMP = '"Museums Around: Cultural Infrastructure and Educational Outcomes"'

# file in the build -> (canonical path, <title>, description)
PAGES = {
    "index.html": ("/", f"{NAME} | Economist, University of Barcelona & IEB", HOME_DESC),
    "research.html": (
        "/research",
        f"Research | {NAME}",
        f"Research by Mengwei Lin, including the job market paper {JMP} "
        "and other work on education and cultural economics.",
    ),
    "teaching.html": (
        "/teaching",
        f"Teaching | {NAME}",
        "Teaching by Mengwei Lin at the University of Barcelona. Instructor of Regional and Local "
        "Public Economics, with experience in microeconomics and applied econometrics.",
    ),
    "jmp-video/index.html": (
        "/jmp-video/",
        f"Job Market Paper Video | {NAME}",
        f"A short video on Mengwei Lin's job market paper, {JMP}.",
    ),
    "activities.html": (
        "/activities",
        f"Activities | {NAME}",
        "Training activities for young researchers that Mengwei Lin initiated and organised at the "
        "UB School of Economics, including the BESTEPS project.",
    ),
    "besteps.html": (
        "/besteps",
        f"BESTEPS | {NAME}",
        "BESTEPS is a training project for junior economists, launched and coordinated by Mengwei Lin "
        "at the UB School of Economics. Seven lectures by leading researchers and a free e-book.",
    ),
    "popul-trans.html": (
        "/popul-trans",
        f"Popularization & Translation 学术科普与翻译 | {NAME}",
        "Public-facing economics articles and book translations by Mengwei Lin (林孟蔚), bringing "
        "research on education, labour and applied micro to Chinese readers.",
    ),
    "cv.html": (
        "/cv",
        f"CV | {NAME}",
        "Curriculum vitae of Mengwei Lin, PhD candidate in Economics at the University of Barcelona and IEB.",
    ),
}

GUIDE_SLUGS = [
    "", "acknowledgements/", "volume-1/", "volume-2/", "preface/", "opening-lecture/",
    "lecture-1/", "lecture-2/", "lecture-3/", "lecture-4/", "lecture-5/", "closing-lecture/", "afterword/",
]
GUIDE_HOME_TITLE = "The BESTEPS Guide (E-book): 7 Lessons towards Effective Economics PhD Research"
SITEMAP_MUST = ["/", "/research", "/teaching", "/jmp-video/", "/activities", "/besteps", "/popul-trans"] + [
    "/besteps/guide/" + s for s in GUIDE_SLUGS
]
SITEMAP_NEVER = ["#", ".html", "/notes/", "/cv", "/403", "/404", "/blog", "/test-page", "/project"]
ABSENT = [
    "blog.html", "test-page.html", "project.html", "search.json", "2020",
    "ARCHITECTURE.md", "README.md", "LICENSE",
]
LD_TYPES = {"WebSite", "Person", "CollegeOrUniversity", "ResearchOrganization"}

failures = []


def check(ok, message):
    if not ok:
        failures.append(message)


def head_of(text):
    m = re.search(r"<head>(.*)</head>", text, re.S)
    return m.group(1) if m else ""


def tag_attr(head, pattern):
    """First capture group of `pattern` in the head, HTML-unescaped; None if absent."""
    m = re.search(pattern, head, re.S)
    return html.unescape(m.group(1)) if m else None


def meta(head, key, attr="name"):
    return tag_attr(head, rf'<meta\s+{attr}=["\']{re.escape(key)}["\']\s+content="([^"]*)"')


def json_ld(head):
    return [json.loads(b) for b in re.findall(r'<script type="application/ld\+json">(.*?)</script>', head, re.S)]


def ld_types(node, found):
    if isinstance(node, dict):
        t = node.get("@type")
        for x in t if isinstance(t, list) else [t] if t else []:
            found.add(x)
        for v in node.values():
            ld_types(v, found)
    elif isinstance(node, list):
        for v in node:
            ld_types(v, found)


def main(site):
    # robots.txt
    robots = (site / "robots.txt").read_text(encoding="utf-8")
    check("Disallow: /notes/" in robots, "robots.txt: /notes/ must stay disallowed")
    check(f"Sitemap: {ORIGIN}/sitemap.xml" in robots, "robots.txt: Sitemap line must be the https URL")
    check("/research" not in robots, "robots.txt: /research is still disallowed")
    check("/teaching" not in robots, "robots.txt: /teaching is still disallowed")

    # sitemap.xml
    try:
        root = ET.fromstring((site / "sitemap.xml").read_text(encoding="utf-8").strip())
        locs = [e.text.strip() for e in root.iter("{http://www.sitemaps.org/schemas/sitemap/0.9}loc")]
    except ET.ParseError as e:
        locs = []
        check(False, f"sitemap.xml: not valid XML ({e})")
    check(len(locs) == len(set(locs)), "sitemap.xml: duplicate URLs")
    for path in SITEMAP_MUST:
        check(ORIGIN + path in locs, f"sitemap.xml: missing {path}")
    for loc in locs:
        check(loc.startswith(ORIGIN + "/"), f"sitemap.xml: not an absolute URL of this site: {loc}")
        rest = loc[len(ORIGIN):]
        for bad in SITEMAP_NEVER:
            check(bad not in rest, f"sitemap.xml: must not list {loc} (contains {bad})")

    # head tags of the main pages
    seen_desc = {}
    for rel, (path, title, desc) in PAGES.items():
        f = site / rel
        if not f.exists():
            check(False, f"{rel}: not built")
            continue
        head = head_of(f.read_text(encoding="utf-8"))
        canonical = ORIGIN + path
        check(tag_attr(head, r"<title>(.*?)</title>") == title, f"{rel}: <title> is {tag_attr(head, r'<title>(.*?)</title>')!r}")
        got = meta(head, "description")
        check(got == desc, f"{rel}: description is {got!r}")
        check(got not in seen_desc, f"{rel}: same description as {seen_desc.get(got)}")
        seen_desc[got] = rel
        check(meta(head, "og:title", "property") == title, f"{rel}: og:title differs from <title>")
        check(meta(head, "og:description", "property") == desc, f"{rel}: og:description differs from description")
        check(tag_attr(head, r'<link rel="canonical" href="([^"]*)"') == canonical, f"{rel}: canonical is not {canonical}")
        check(meta(head, "og:url", "property") == canonical, f"{rel}: og:url is not {canonical}")
        check((meta(head, "og:image", "property") or "").startswith("https://"), f"{rel}: og:image is not an absolute URL")
        check(meta(head, "robots") is None, f"{rel}: must not carry a robots meta tag")
        for bad in ("<br", "&lt;br", "Econonics", "facebook.com"):
            check(bad not in head, f"{rel}: head contains {bad!r}")
        if rel != "index.html":
            check(not json_ld(head), f"{rel}: JSON-LD belongs on the home page only")

    # error pages: fall back to the home description, never indexed
    for rel in ("404.html", "403.html"):
        head = head_of((site / rel).read_text(encoding="utf-8"))
        check(meta(head, "description") == HOME_DESC, f"{rel}: description must fall back to the home description")
        check(meta(head, "robots") == "noindex", f"{rel}: must be noindex")

    # structured data on the home page
    try:
        blocks = json_ld(head_of((site / "index.html").read_text(encoding="utf-8")))
    except json.JSONDecodeError as e:
        blocks = []
        check(False, f"index.html: JSON-LD does not parse ({e})")
    nodes = [n for b in blocks for n in (b if isinstance(b, list) else b.get("@graph", [b]))]
    websites = [n for n in nodes if n.get("@type") == "WebSite"]
    people = [n for n in nodes if n.get("@type") == "Person"]
    check(len(websites) == 1 and websites[0].get("name") == "Mengwei Lin", 'index.html: need one WebSite named "Mengwei Lin"')
    check(len(people) == 1 and people[0].get("name") == "Mengwei Lin", "index.html: need one Person")
    types = set()
    ld_types(blocks, types)
    check(types <= LD_TYPES, f"index.html: unexpected schema.org types {sorted(types - LD_TYPES)}")

    # guide pages keep their own head
    ghead = head_of((site / "besteps/guide/index.html").read_text(encoding="utf-8"))
    check(tag_attr(ghead, r"<title>(.*?)</title>") == GUIDE_HOME_TITLE, "guide home: <title> changed")
    check(tag_attr(ghead, r'<link rel="canonical" href="([^"]*)"') == ORIGIN + "/besteps/guide/", "guide home: canonical changed")

    # leftovers that must not be published
    for rel in ABSENT:
        check(not (site / rel).exists(), f"{rel}: should not be in the build")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(Path(sys.argv[1]))
    if failures:
        print(f"{len(failures)} check(s) failed:")
        for f in failures:
            print("  -", f)
        sys.exit(1)
    print("All SEO checks passed.")
