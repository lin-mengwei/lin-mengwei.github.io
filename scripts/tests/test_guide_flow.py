import pytest

from guide_flow import add_links, clean, light_only

SAMPLE = (
    '<?xml version="1.0"?>\n<!-- comment -->\n'
    '<svg xmlns="http://www.w3.org/2000/svg" style="color-scheme: light dark;" width="1059px" height="510px" '
    'viewBox="0 0 1059 510" content="&lt;mxfile&gt;">'
    '<style type="text/css">@supports (color: light-dark(#000, #fff)) { #x { --a: 1; } }</style>'
    '<rect fill="#ffffff" width="100%" height="100%" x="0" y="0"/>'
    '<path style="stroke: light-dark(rgb(0, 90, 139), rgb(110, 187, 229));"/>'
    '<switch><foreignObject requiredFeatures="http://x"><div style="color: light-dark(#005A8B, #6ebbe5);">'
    'Lecture 1</div></foreignObject><image x="1" xlink:href="data:image/png;base64,AAAA"/></switch></svg>'
)


def test_light_only_keeps_first_argument_with_nested_calls():
    assert light_only("a light-dark(rgb(0, 90, 139), var(--d, #121212)) b") == "a rgb(0, 90, 139) b"


def test_clean_strips_editor_data_fallbacks_and_dark_mode():
    out = clean(SAMPLE, links={})
    svg = out.split("\n", 1)[1]
    assert svg.startswith('<svg xmlns="http://www.w3.org/2000/svg"')
    assert 'viewBox="0 0 1059 510"' in svg and 'width="1059px"' not in svg
    for gone in ("content=", "light-dark", "color-scheme", "<image", "base64", "<switch", "@supports", "requiredFeatures"):
        assert gone not in svg, gone
    assert "<foreignObject><div" in svg and "Lecture 1" in svg
    assert "stroke: rgb(0, 90, 139)" in svg


def test_clean_refuses_liquid_syntax():
    with pytest.raises(ValueError):
        clean(SAMPLE.replace("Lecture 1", "{{ x }}"), links={})


CELLS = ('<svg><g data-cell-id="a-8"><g><rect/></g><g><text>Find an Idea (Lecture 1)</text></g></g>'
         '<g data-cell-id="a-2"><g><path/></g></g><g data-cell-id="a-9"><path/></g></svg>')
LINKS = {"lecture-1": {"label": "8", "text": "Lecture 1", "parts": ["2"], "name": "Lecture 1"}}


def test_add_links_wraps_label_and_arrow():
    out = add_links(CELLS, LINKS)
    assert out.count('href="/besteps/guide/lecture-1/"') == 2
    assert '<a href="/besteps/guide/lecture-1/" class="guide-flow-link" data-flow="lecture-1" aria-label="Lecture 1">' \
           '<g data-cell-id="a-8">' in out
    assert '<g data-cell-id="a-2"><g><path/></g></g></a><g data-cell-id="a-9">' in out
    assert 'tabindex="-1" aria-hidden="true"><g data-cell-id="a-2">' in out


def test_add_links_checks_label_text_and_cells():
    with pytest.raises(ValueError, match="does not read"):
        add_links(CELLS.replace("Lecture 1", "Lecture 2"), LINKS)
    with pytest.raises(ValueError, match="not found"):
        add_links(CELLS.replace('"a-2"', '"a-99"'), LINKS)
