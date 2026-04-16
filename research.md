---
title: Research
layout: research
nav_active: research
---

<div class="research-statement">
  <div class="rs-label"><b>Research Statement</b></div>
  <p>My research is in applied microeconomics, focusing on education, urban, and cultural economics. I use applied econometric methods to analyze how social environment and institutional incentives shape education decisions and performance, and how these factors translate into labour market and demographic outcomes. </p>
</div>

<h2 class="research-section-title" id="work-in-progress"><i class="fas fa-flask"></i> Work in Progress</h2>

{% assign wip = site.data.research | where: "section", "wip" %}
{% for paper in wip %}
{% include research-card.html
  title=paper.title
  status=paper.status
  stage=paper.stage
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

<!-- <h2 class="research-section-title" id="working-papers"><i class="fas fa-file-alt"></i> Working Papers</h2>
<p class="research-empty-note">Coming soon.</p> -->