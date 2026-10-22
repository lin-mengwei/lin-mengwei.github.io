import yaml
from PIL import Image

from guide_photos import build, crop


def test_crop_uses_fractions(tmp_path):
    p = tmp_path / "lecture-1.png"
    Image.new("RGB", (1000, 2000), "white").save(p)
    assert crop(p, (0.1, 0.25, 0.6, 0.5)).size == (500, 500)


def test_build_writes_photos_and_data(tmp_path):
    posters = tmp_path / "posters"
    posters.mkdir()
    Image.new("RGB", (1300, 1350), "white").save(posters / "lecture-3.jpg")
    Image.new("RGB", (1080, 1315), "white").save(posters / "lecture-1.png")
    out, data_file = tmp_path / "out", tmp_path / "photos.yml"
    data = build(posters, out, data_file)
    assert set(data) == {"lecture-1", "lecture-3"}
    assert [p["src"].rsplit("/", 1)[1] for p in data["lecture-3"]["photos"]] == ["lecture-3-1.jpg", "lecture-3-2.jpg"]
    assert (out / "lecture-1.jpg").exists()
    assert data["lecture-3"]["caption"] == "Dirk Foremny and Guillermo Marín at the BESTEPS lecture, 29 September 2025."
    assert yaml.safe_load(data_file.read_text(encoding="utf-8"))["lecture-1"]["photos"][0]["alt"]


def test_publicity_file_names_are_recognised(tmp_path):
    from guide_photos import find_poster
    Image.new("RGB", (10, 10)).save(tmp_path / "pic_BESTEPS_jmp.jpg")
    assert find_poster(tmp_path, "lecture-5").name == "pic_BESTEPS_jmp.jpg"
    assert find_poster(tmp_path, "lecture-4") is None
