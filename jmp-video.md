---
title: Job Market Paper Video
layout: research
permalink: /jmp-video/
# Video, subtitles, the "How this video was made" panel, the paper link
# card's texts and the YouTube fallback are all set in _data/jmp_video.yml.
# The paper title and PDF come from _data/research.yml (jmp: true).
---

{% assign paper = site.data.research | where: "jmp", true | first %}

{% include jmp-video.html title=paper.title pdf=paper.pdf %}
