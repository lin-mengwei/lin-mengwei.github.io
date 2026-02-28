# 🗂️ 项目文件关系图 / File Dependency Map

> 自动生成于重构完成后，展示 Jekyll 站点所有文件之间的依赖关系。

## 总体架构 / Overall Architecture

```mermaid
graph TB
    subgraph CONFIG["⚙️ Configuration"]
        _config[_config.yml]
    end

    subgraph DATA["📊 Data Files (_data/)"]
        news[news.yml]
        projects[projects.yml]
        research_data[research.yml]
        teaching_other[teaching_other.yml]
    end

    subgraph CONTENT["📝 Content Pages (*.md)"]
        index[index.md]
        research_md[research.md]
        teaching_md[teaching.md]
        blog_md[blog.md]
        activities_md[activities.md]
        popul_trans[popul-trans.md]
        besteps[besteps.md]
        project_md[project.md]
        err404[404.md]
        err403[403.md]
    end

    subgraph COURSES["📚 Courses (_courses/)"]
        course2024[region-public-econ-2024.md]
        course2023[region-public-econ-2023.md]
    end

    subgraph POSTS["✏️ Blog Posts (_posts/)"]
        post1[2020-04-21-*.md]
        post2[2020-04-22-*.md]
        post3[2020-04-24-*.md]
    end

    subgraph LAYOUTS["🖼️ Layouts (_layouts/)"]
        compress[compress.html]
        base[base.html]
        default[default.html]
        research_layout[research.html]
        teaching_layout[teaching.html]
        blog_layout[blog.html]
        post_layout[post.html]
        course_layout[course.html]
        activities_layout[activities.html]
        translation_layout[translation.html]
        page_layout[page.html]
        layout404[404.html]
    end

    subgraph INCLUDES["🧩 Includes (_includes/)"]
        head[head.html]
        meta[meta.html]
        navbar[navbar.html]
        footer[footer.html]
        showcase[showcase.html]
        about[about.html]
        blog_card[blog-card.html]
        teaching_card[teaching-card.html]
        teaching_heading[teaching-heading.html]
        research_card[research-card.html]
        project_card[project-card.html]
        search_init[search-init.html]
        disqus[disqus.html]
        blogpage_heading[blogpage-heading.html]
    end

    subgraph SCSS["🎨 Styles"]
        style_entry[assets/css/style.scss]
        main_scss[_sass/main.scss]
        vars[_variables.scss]
        base_scss[_base.scss]
        navbar_scss[_navbar.scss]
        hero_scss[_hero.scss]
        about_scss[_about.scss]
        research_scss[_research.scss]
        teaching_scss[_teaching.scss]
        blog_scss[_blog.scss]
        activities_scss[_activities.scss]
        translation_scss[_translation.scss]
        post_scss[_post.scss]
        footer_scss[_footer.scss]
        components_scss[_components.scss]
    end

    subgraph JS["⚡ JavaScript"]
        search_js[assets/js/simple-jekyll-search.js]
    end

    subgraph OUTPUT["📤 Output"]
        style_css[_site/assets/css/style.css]
    end
```

## 布局继承链 / Layout Inheritance

```mermaid
graph LR
    compress[compress.html<br/>HTML minification] --> base[base.html<br/>HTML skeleton]
    base --> default[default.html<br/>Homepage]
    base --> research_layout[research.html]
    base --> teaching_layout[teaching.html]
    base --> blog_layout[blog.html]
    base --> post_layout[post.html]
    base --> course_layout[course.html]
    base --> activities_layout[activities.html]
    base --> translation_layout[translation.html]
    base --> page_layout[page.html]
    base --> layout404[404.html]

    style compress fill:#f9f,stroke:#333,stroke-width:2px
    style base fill:#bbf,stroke:#333,stroke-width:2px
```

## base.html 引用关系 / base.html Dependencies

```mermaid
graph TD
    base[base.html] -->|includes| head[head.html]
    base -->|includes| navbar[navbar.html]
    base -->|includes| footer[footer.html]
    head -->|includes| meta[meta.html]
    head -->|loads| bulma[Bulma CDN v0.9.4]
    head -->|loads| fonts[Google Fonts - Poppins]
    head -->|loads| fa[Font Awesome 6.6.0]
    head -->|loads| style_css[style.css]
    head -->|sets| css_var["--hero-image CSS var"]
    
    navbar -->|reads| _config[_config.yml]
    navbar -->|reads| page_nav["page.nav_active"]
    footer -->|reads| _config
    
    style base fill:#bbf,stroke:#333,stroke-width:2px
    style head fill:#fbb,stroke:#333
    style navbar fill:#fbb,stroke:#333
    style footer fill:#fbb,stroke:#333
```

## 各页面的 Include 依赖 / Page-specific Include Dependencies

```mermaid
graph TD
    subgraph "Homepage (default.html)"
        default[default.html] -->|includes| showcase[showcase.html]
        default -->|includes| about[about.html]
        about -->|reads| news_data[_data/news.yml]
        about -->|reads| config1[_config.yml<br/>author-image, social links]
    end

    subgraph "Research (research.html)"
        research_l[research.html] -->|includes| disqus1[disqus.html]
        research_md2[research.md] -->|includes| research_card[research-card.html]
        research_md2 -->|reads| research_data[_data/research.yml]
    end

    subgraph "Teaching (teaching.html)"
        teaching_l[teaching.html] -->|includes| teaching_heading[teaching-heading.html]
        teaching_l -->|includes| teaching_card[teaching-card.html]
        teaching_l -->|includes| search_init1[search-init.html]
        teaching_l -->|reads| teaching_other[_data/teaching_other.yml]
        teaching_card -->|links to| courses[_courses/*.md]
    end

    subgraph "Blog (blog.html)"
        blog_l[blog.html] -->|includes| blogpage_heading[blogpage-heading.html]
        blog_l -->|includes| blog_card[blog-card.html]
        blog_l -->|includes| search_init2[search-init.html]
        blog_l -->|includes| disqus2[disqus.html]
        blog_card -->|iterates| posts[_posts/*.md]
    end

    subgraph "Post (post.html)"
        post_l[post.html] -->|includes| disqus3[disqus.html]
    end

    subgraph "Course (course.html)"
        course_l[course.html] -->|includes| disqus4[disqus.html]
    end

    subgraph "Translation / Activities"
        translation_l[translation.html] -->|includes| disqus5[disqus.html]
        activities_l[activities.html] -->|includes| disqus6[disqus.html]
    end

    search_init1 -->|loads| search_js[simple-jekyll-search.js]
    search_init2 -->|loads| search_js
    search_init1 -->|reads| search_json[search.json]
    search_init2 -->|reads| search_json
```

## SCSS 模块结构 / SCSS Module Structure

```mermaid
graph TD
    style_entry["assets/css/style.scss<br/>(entry point, front matter)"] -->|@import| main["_sass/main.scss<br/>(import hub)"]
    
    main -->|@import| vars[_variables.scss<br/>colors, fonts, tag map]
    main -->|@import| base_scss[_base.scss<br/>scrollbar, selection, global]
    main -->|@import| navbar_scss[_navbar.scss<br/>opacity, hover, active]
    main -->|@import| hero_scss[_hero.scss<br/>gradient, blur bg]
    main -->|@import| about_scss[_about.scss<br/>#about section]
    main -->|@import| research_scss[_research.scss<br/>cards, tags, images]
    main -->|@import| teaching_scss[_teaching.scss<br/>banner, cards, course]
    main -->|@import| blog_scss[_blog.scss<br/>blog cards, hover]
    main -->|@import| activities_scss[_activities.scss<br/>accordion, details]
    main -->|@import| translation_scss[_translation.scss<br/>books section]
    main -->|@import| post_scss[_post.scss<br/>post content, page]
    main -->|@import| footer_scss[_footer.scss<br/>backtotop, credits]
    main -->|@import| components_scss[_components.scss<br/>search, project, contact]

    hero_scss -->|uses| css_var["var(--hero-image)<br/>set in head.html"]
    research_scss -->|uses| vars
    about_scss -->|uses| vars
    navbar_scss -->|uses| vars

    style style_entry fill:#ffd,stroke:#333,stroke-width:2px
    style main fill:#dfd,stroke:#333,stroke-width:2px
    style vars fill:#fdd,stroke:#333
```

## 数据流 / Data Flow

```mermaid
graph LR
    subgraph "Data Sources"
        config[_config.yml]
        news[_data/news.yml]
        projects[_data/projects.yml]
        research_yml[_data/research.yml]
        teaching_yml[_data/teaching_other.yml]
    end

    subgraph "Consumers"
        about[about.html] 
        project_page[project.md]
        research_page[research.md]
        teaching_page[teaching.html layout]
        navbar[navbar.html]
        footer[footer.html]
        head[head.html]
        showcase[showcase.html]
    end

    config -->|site.title, description| head
    config -->|heroimage via CSS var| head
    config -->|author-image, social links| about
    config -->|footer-address, logos| footer
    config -->|disqus-shortname| disqus[disqus.html]

    news -->|recent 5 items| about
    projects -->|project list| project_page
    research_yml -->|paper data| research_page
    teaching_yml -->|other teaching exp| teaching_page
```

## 文件清单 / Complete File Inventory

| 类别 | 文件 | 用途 |
|------|------|------|
| **Config** | `_config.yml` | 全局配置 + footer地址/logo |
| **Data** | `_data/news.yml` | 首页新闻 |
| | `_data/projects.yml` | 项目列表 |
| | `_data/research.yml` | 研究论文数据 |
| | `_data/teaching_other.yml` | 其他教学经历 |
| **Layouts** | `compress.html` | HTML压缩 |
| | `base.html` | 统一HTML骨架 |
| | `default.html` | 首页 |
| | `research.html` | 研究页 |
| | `teaching.html` | 教学页 |
| | `blog.html` | 博客列表 |
| | `post.html` | 博客文章 |
| | `course.html` | 课程详情 |
| | `activities.html` | 活动页 |
| | `translation.html` | 翻译/科普页 |
| | `page.html` | 通用页面 |
| | `404.html` | 404错误页 |
| **Includes** | `head.html` → `meta.html` | HTML head |
| | `navbar.html` | 导航栏 (支持nav_active) |
| | `footer.html` | 页脚 (数据驱动) |
| | `showcase.html` | 首页hero |
| | `about.html` | 个人简介 |
| | `research-card.html` | 研究卡片模板 |
| | `teaching-card.html` | 教学卡片模板 |
| | `teaching-heading.html` | 教学页标题 |
| | `blog-card.html` | 博客卡片模板 |
| | `blogpage-heading.html` | 博客页标题 |
| | `project-card.html` | 项目卡片模板 |
| | `search-init.html` | 搜索初始化 (提取) |
| | `disqus.html` | 评论系统 (提取) |
| **SCSS** | `assets/css/style.scss` | 入口 (仅@import) |
| | `_sass/main.scss` | 导入枢纽 |
| | `_sass/_variables.scss` | 颜色/字体变量 |
| | `_sass/_base.scss` | 全局基础样式 |
| | `_sass/_navbar.scss` | 导航栏样式 |
| | `_sass/_hero.scss` | Hero区域样式 |
| | `_sass/_about.scss` | 关于区域样式 |
| | `_sass/_research.scss` | 研究页样式 |
| | `_sass/_teaching.scss` | 教学页样式 |
| | `_sass/_blog.scss` | 博客样式 |
| | `_sass/_activities.scss` | 活动页样式 |
| | `_sass/_translation.scss` | 翻译页样式 |
| | `_sass/_post.scss` | 文章页样式 |
| | `_sass/_footer.scss` | 页脚样式 |
| | `_sass/_components.scss` | 搜索/项目/联系 |
| **JS** | `assets/js/simple-jekyll-search.js` | 搜索引擎 |
| **Deprecated** | `_deprecated/` | 已弃用文件存档 |
