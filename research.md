---
title: Research Projects
layout: research
nav_active: research
---
This site is under construction.
<div style="position: flex; right: 0; padding: 10px; border-radius: 5px;">
    <strong>Life Stages of Projects</strong><br>
    <a href="#work-in-progress">Work in Progress</a><br>
    <a href="#working-papers">Working Papers</a>
</div>


# Work in Progress

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

# Working Papers