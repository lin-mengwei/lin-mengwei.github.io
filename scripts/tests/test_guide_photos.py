import numpy as np
import yaml
from PIL import Image, ImageDraw

from guide_photos import build, extract, find_poster

BLUE = (0, 90, 140)


def poster(path, size=(1080, 1315), photo=(100, 400, 1000, 900), cut=120, collage=False):
    """A fake poster: blue background, white frame, a photo with cut corners, a decorative line and some text."""
    im = Image.new("RGB", size, BLUE)
    d = ImageDraw.Draw(im)
    d.rectangle([15, 15, size[0] - 16, size[1] - 16], outline="white", width=2)
    l, t, r, b = photo
    if collage:
        d.rectangle([60, 380, 500, 900], fill=(150, 60, 60))
        d.rectangle([560, 620, 1000, 1100], fill=(60, 150, 60))
    else:
        d.polygon([(l + cut, t), (r, t), (r, b - cut), (r - cut, b), (l, b), (l, t + cut)], fill=(200, 120, 80))
        d.line([(l - 10, t + cut + 60), (l + cut + 60, t - 10)], fill="white", width=3)   # decorative line
    d.text((120, 1000), "Albrecht Glitz", fill="white")
    im.save(path)
    return path


def test_extract_keeps_frame_and_clears_corners_lines_and_text(tmp_path):
    img = extract(poster(tmp_path / "p.png"), {"who": ["X"]})
    assert img.size == (901, 501)
    a = np.asarray(img)[:, :, 3]
    assert a[0, 0] == 0 and a[-1, -1] == 0                 # cut corners are transparent
    assert a[0, -1] == 255 and a[-1, 0] == 255 and a[250, 450] == 255


def test_extract_collage_keeps_the_photos_only(tmp_path):
    img = extract(poster(tmp_path / "c.png", size=(1300, 1350), collage=True), {"who": ["A", "B"], "collage": 2})
    assert img.size == (941, 721)
    a = np.asarray(img)[:, :, 3]
    assert a[10, 10] == 255 and a[-10, -10] == 255 and a[-10, 10] == 0


def test_extract_max_y_trims_the_bottom(tmp_path):
    img = extract(poster(tmp_path / "p.png"), {"who": ["X"], "max_y": 600 / 1315})
    assert img.height == 200


def test_build_writes_photos_and_data(tmp_path):
    posters = tmp_path / "posters"
    posters.mkdir()
    poster(posters / "lecture-3.jpg", size=(1300, 1350), collage=True)
    poster(posters / "lecture-1.png")
    out, data_file = tmp_path / "out", tmp_path / "photos.yml"
    out.mkdir()
    (out / "lecture-1.jpg").write_bytes(b"old")
    data = build(posters, out, data_file)
    assert set(data) == {"lecture-1", "lecture-3"}
    assert data["lecture-3"]["photos"][0]["src"].endswith("/lecture-3.webp")
    assert sorted(p.name for p in out.iterdir()) == ["lecture-1.webp", "lecture-3.webp"]
    assert data["lecture-3"]["caption"] == "Dirk Foremny and Guillermo Marín at the BESTEPS lecture."
    assert yaml.safe_load(data_file.read_text(encoding="utf-8"))["lecture-1"]["photos"][0]["alt"]


def test_publicity_file_names_are_recognised(tmp_path):
    Image.new("RGB", (10, 10)).save(tmp_path / "pic_BESTEPS_jmp.jpg")
    assert find_poster(tmp_path, "lecture-5").name == "pic_BESTEPS_jmp.jpg"
    assert find_poster(tmp_path, "lecture-4") is None
