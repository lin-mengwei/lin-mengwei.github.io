---
title: Job Market Paper
layout: research
permalink: /jmp-video/
# YouTube video ID (the part after "v=" in the video link).
# Leave empty until the video is uploaded; the page then shows the paper only.
video_id:
---

{% assign paper = site.data.research | where: "jmp", true | first %}

<style>
  .jmp-video { position: relative; width: 100%; aspect-ratio: 16 / 9; margin: 0 0 1.5rem; border-radius: 8px; overflow: hidden; background: #000; }
  .jmp-video iframe { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; }
  .jmp-figures { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 1rem; align-items: start; margin: 1.25rem 0 0.5rem; }
  .jmp-figures img { display: block; width: 100%; height: auto; border-radius: 6px; }
  .jmp-abstract { margin: 0.75rem 0 1rem; line-height: 1.65; }
</style>

{% if page.video_id %}
<div class="jmp-video">
  <iframe src="https://www.youtube-nocookie.com/embed/{{ page.video_id }}"
          title="Video summary: {{ paper.title }}"
          allow="accelerometer; encrypted-media; picture-in-picture; fullscreen"
          allowfullscreen loading="lazy"></iframe>
</div>
{% endif %}

<div class="research-card research-card--full">
  <div class="research-card-header">
    <h3 class="research-card-title">{{ paper.title }}</h3>
    {% include research-links.html pdf=paper.pdf links=paper.links updated=paper.updated %}
  </div>

  <span class="jmp-badge"><i class="fas fa-star"></i> Job Market Paper</span>

  <p class="abstract-text jmp-abstract">{{ paper.abstract }}</p>

  {% if paper.keywords %}
  <p class="research-meta"><strong>Keywords:</strong> {{ paper.keywords }}</p>
  {% endif %}

  {% if paper.jel %}
  <p class="research-meta"><strong>JEL Codes:</strong> {{ paper.jel }}</p>
  {% endif %}

  {% if paper.image1 %}
  <div class="jmp-figures">
    <a href="{{ paper.image1 | relative_url }}" target="_blank" rel="noopener"><img src="{{ paper.image1 | relative_url }}" alt="Figure 1 of the job market paper"></a>
    {% if paper.image2 %}<a href="{{ paper.image2 | relative_url }}" target="_blank" rel="noopener"><img src="{{ paper.image2 | relative_url }}" alt="Figure 2 of the job market paper"></a>{% endif %}
  </div>
  {% endif %}

  {% if paper.tags %}
  <div class="research-card-tags">
    {% assign tag_list = paper.tags | split: "," %}
    {% for tag in tag_list %}
      {% assign tag_class = tag | strip | downcase | replace: ' ', '-' %}
      <span class="tag tag-{{ tag_class }}">{{ tag | strip }}</span>
    {% endfor %}
  </div>
  {% endif %}
</div>
