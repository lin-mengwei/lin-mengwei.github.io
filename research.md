---
title: Research
layout: research
nav_active: research
---

<h2 class="research-section-title" id="work-in-progress"><i class="fas fa-flask"></i> Work in Progress</h2>

{% assign wip = site.data.research | where: "section", "wip" %}
{% for paper in wip %}
{% include research-card.html
  title=paper.title
  status=paper.status
  tags=paper.tags
  coauthors=paper.coauthors
  abstract=paper.abstract
  keywords=paper.keywords
  jel=paper.jel
  presented=paper.presented
  image1=paper.image1
  image2=paper.image2
  image=paper.image
%}
{% endfor %}

<h2 class="research-section-title" id="working-papers"><i class="fas fa-file-alt"></i> Working Papers</h2>
<p class="research-empty-note">Coming soon.</p>