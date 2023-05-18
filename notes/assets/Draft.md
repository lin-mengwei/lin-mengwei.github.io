# Research Plan

[Notes]

- put in support from the literature

## 1. Introduction

<u>[general intro here]</u>

## 2. Chapter 1  *Tuition Fees and Efficient Use of Higher Educational Resources*

### 2.1 Background and Motivation

Higher education plays a vital role within the education system. At the country level, each year significant resources are allocated to tertiary education institutions; at the individual level, students' performance during this period directly influences their transition from being students to becoming productive members of society in the next stage of their life. In OECD countries, for example, the amount of per-student spending surpasses that of other levels of education, and these public investments have continued to rise at a faster pace than the increase in enrolment rates. However, the utilization of these funds does not seem to be as efficient as expected. Low graduation rates and delayed graduation among university students have long been a serious concern across countries even in the world's most developed countries, as evidenced by recent data showing that only 39% of undergraduates in OECD countries graduate on time and that more than a fifth of enrolled students do not manage to graduate after all (OECD, 2022). It seems that resources have continuously been invested in higher education, but they fail to yield the desired outcomes.

A critical aspect of higher education funding revolves around public subsidies on tuition fees. There has been an ongoing debate in policy practice or theoretical research on whether public universities should charge fees, to what extent the state should provide financial support for students, and what portion of the cost of higher education should be borne by individuals. To this day we are still far from reaching consensus. Over the past few decades, there have been numerous policy attempts addressing the issue of tuition fees in higher education. These policies have sparked considerable discussion and debate. For instance, England implemented tuition fees in 1998, while several German states introduced fees in the early 21st century only to abandon them approximately a decade later. These examples represent significant shifts in the systems, transitioning from free education to fee-based or vice versa. However, it is important to note that in practice, rather than experiencing radical changes such as complete introductions or cancellations of fees, many educational systems undergo modifications in the levels of tuition fees. How can tuition fees be adjusted to make the financial investment in higher education more efficient? Or, according the logic of economics, will higher or lower tuition fees motivate students to use higher educational resources more efficiently and produce better academic performance, and to what extent will so? These are not only academic questions to be answer, but also significant in the practice of fiscal and educational policy.



### 2.2 Objectives and Expected Contribution

The 2008 financial crisis in the United States spread to the world, leading to the largest global economic crisis in decades. European countries were greatly affected, and many governments fell into difficulties. The Spanish government, in order to reduce expenses, had to increase university tuition fees in the following years. This change was nationwide. The price changes in Catalonia occurred between 2010 and 2012; before and after this period, the university tuition fees in the region remained relatively stable, providing us with an ideal policy change for our research. Taking advantage of this change in tuition fees, we attempt to find out whether the increase in tuition fees has an impact on students' behaviors in the university: Will increased tuition fees incentivize them to work harder so as to graduate as quickly as possible, or does the increase in costs cause more pressure psychologically and actually have a negative impact, or students are not concerned about changes in tuition fees so that their behaviours will not change significantly? 

<u>[insert line chart here]</u>

Besides, in Catalonia, the tuition levels for enrolling in a course for the first time and for subsequent repetitions of the same course are different. Before 2010, such differences were not significant [try to quantify it here]. However, after the policy change, the highest price per credit for retaking a course (for the fourth and subsequent times of repetition) has become almost four times the price for the first enrolment. In this situation, we are able to further explore the performance of financial investment in higher education. Does reducing the subsidy level for course repetitions and increasing the cost of retraining for students motivate them to make greater efforts so that they retake fewer courses? Does it prompt students to complete their studies faster and reduce the proportion of delayed graduation?

<u>[contribute to intuition fees]</u> Since the last century, economists have been paying attention to the impact of financial incentives on students [citing earlier articles], but a large portion of existing papers have studied the impact of various aids and scholarships (such as xxxx). Logically speaking, tuition fees are primary and subsidies are secondary. (?) Yet, there is no consensus in the academic community on the causal relationship between changes in tuition fees and student behaviors and performance. This is mainly because, compared to the introduction of aids and scholarships, tuition fees are more difficult to change due to procedural complexity, especially for public universities whose fees are strictly regulated by laws. Thus there are relatively few available policies to explore. This chapter exploits the changes in tuition fees in the Catalan region to study the impact of tuition increases and decreases on students, and contributes to the study of how tuition fees affect student behaviors.

<u>[contribute to analyzing the intensive margin]</u> Using the data from a single university, we examine the intensive margin. In previous research, many studies have been devoted to exploring the extensive margin. According to a meta-analysis of the literature by Havranek et al (2017), although most research reports that increasing tuition fees would lower enrollment rates, after adjusting for publication bias, this mean effect has become close to zero. For the intensive margin, the results are not as clear...

Using data from different undergraduate programs, we are also able to explore the heterogeneity among subjects with different characteristics in the face of the reduction of financial resources the university receives. For instance, disciplines with heavier reliance in experiments will probably suffer from a negative impact in student outcomes; disciplines with closer connections with the economic sector outside of universities might experience a negative effect in student performance as students may react to the increasing tuition fees by spending more time in doing part-time jobs (or maybe students in such disciplines are less affected because they can compensate for this increase by working part-time more easily). 


### 2.3 Identification Strategy and Data

#### 1) Data

We use the administrative data from the University of Barcelona (UB), which provides a detailed record of the academic performance of undergraduate students before and after the change in tuition fees. The sample consists of all students who enrolled at UB from 2007 to 2017. Our data includes their course selection, grades, retakes, and graduation dates. It also incorporates the background information of students recorded during the pre-enrollment process, as well as their performance in the college entrance examination.

The main outcome variables we use to indicate academic behaviors include: 1) grades a student obtained, 2) the number of enrollments for a course before passing it, 3) the number of courses a student enroll in, and 4) a dummy indicating whether a student passes a course for each time of enrollment, among others. These outcomes help us to identify effects in the intensive margin, which is our main target in this research as described in previous sections. Besides, we also investigate the drop-out and completion rates, as well as pre-enrolment characteristics such as relative performance in the College Entrance Exam, which complements our main analysis by looking at the extensive margin. 

#### 2) Methodology

a. Diff-in-Diff

In order to identify how such a policy shock in tuition fees affects students' performance, we use a staggered Difference-in-Difference specification as our baseline model: 
$$
y_{ijk}=\alpha_k+\gamma_j+\beta D_{ijk}+\theta X_i+\varepsilon_{ijk},
$$
where $y_{ijk}$ denotes the outcomes as defined above for individual $i$ in cohort $j$ at the $k$-th year of study, $D_{ijk}$ indicates whether this individual is exposed to the rise in fees, $\alpha_k$ captures the fixed effects for different years of study, $\gamma_j$ captures the fixed effects for cohort $j$, and $X_i$ is a vector of characteristics of individual $i$. We assume that, in the absence of the rise in tuition fees, the pattern of evolution of students' behaviors as they proceed to higher years of study does not change across cohorts, while the absolute levels of performance may change from cohort to cohort. This assumption lays the foundation for identifying the causal effects of the policy change in tuition fees using the above specification. To illustrate, an individual in the 2008 cohort ($j=2008$), was affected by the sharp increase in tuition fees in the academic year 2010/11, which is the third year of her university study ($k=3$). Therefore, our regression will capture any possible changes in her performance from the second to the third year, which, when compared to that of another individual in the 2007 cohort from his second to third year, will lead us to the effect caused by the rise in tuition fees.

(To disentangle the effect for extra punishment of failure: In academic year 2010/2011, there is a sharp increase in third-time enrollment for the same course, while the fees for the first and second registrations do not change significantly compared to previous years. Thus, by using a Diff-in-Diff or event study, we can separate the effect of the extra costs on failing for the third and subsequent times. That is, we compare academic performance of students in different cohorts exposed to the first rise in tuition fees in 2010/11 in their different years of study.)

b. RD in Time

<!-- y_{it}=\alpha+\gamma\cdot\mathbb{1}(t>2010)(+\beta Fee_{it})+\varepsilon_{it} However, in academic year 2011/12, there is another shock where not only does failing for more times will generate higher costs, but also does the first and second times - a general increase in tuition fees. In this sense, it is difficult to disentangle the effects of heavier punishment for failure and the rise in tuition fees in general. We can use an RDiT to capture the effects.--> 


### 2.4 Pilot Results



## 3. Chapter 2  *Education and Labor Market Risks in China* 

### 3.1 Motivation and Background

"Good good study, safe safe job!" Seeking to lower risks in the labour market through education has been pursuit of many families over decades. In the first half of the 20th century, China experienced the trauma of the Japanese Invasion and the following civil war; turbulence and unrest was the theme of the time, and a sense of insecurity and anxiety about life and future was engraved into the collective memory. Generations afterwards - probably up until the Reform and Opening Up - thus bear the obssession for "stable" jobs and pass the preference onto following generations through the mechanism of expectation. Today, "Study well, find a stable job, and get married." is still commonly heard in Chinese families. A joke usually seen online nowdays about Chinese parents' perception of a "good job" goes: "If you are not a civil servant, a teacher, a doctor, or an SOE employer, you are having an unworthy job." Although the joke is exagerating, it reflects the mindset of previous generations to explicitly pursue jobs that are secure (the "Iron Rice Bowls") to such an extreme point  that other jobs, such as being employed in a private company, are sometimes considered not decent.

In the literature of financial investment, returns and risks are explored; in the past decades, research on risks has been attracting even more attention from academia. Yet, in the field of human captial investment, the estimation of returns to eduation, training and health has always been at the center of the stage, leaving risks relatively little explored. 

### 3.2 Objectives and Expected Contribution

In this chapter,

Parallel to the ideas of return and risk in financial investment which take the forms of financial market performance, returns and risks to human capital, especially to education, can be defined as labor market outcomes and their uncertainty. Take salary as an example. The returns one receives from higher education compared to high school can be defined as the marginal increase of expected wages one earns if they go to college instead of leaving school after high school, holding other factors constant. One possible definition of the risk of this outcome would be the probability of this marginal increase to be negative, or, more broadly, the . (Risks of investing in a stock, for example, can be defined as the probability of receiving a negative return, compared to taking no action in the financial market, i.e., the risk-free rate.)

Such corresponding definitions can be used in various labor market outcomes, such as employment status - the marginal increase in job stability (measured for example as the average time staying in the same job) for receiving more education, and the probability of this increase to be negative. Considering the perpetuity of the returns to human capital investment, we can also define risks of such returns as the fluctuation of salary over the life cycle, as in Delaney and Devereux (2021).

### 3.3 Potential Identification Strategy and Data




## 4. Chapter 3  *Make Gray the New Green: Human Capital Re-Investment in Aging Workers*

### 4.1 Background and Motivation

Population aging has been becoming the new norm of the world, albeit at varying rates across different regions. Developed countries in Europe and North America find themselves in the middle stage of this demographic shift, while developing countries such as China are in the early stages. Regardless of their current position, all countries face similar challenges arising from population aging, including a decline in the working-age population and an increase in the dependency ratio. These may lead to conflicts in the distribution of resources, economic recessions, and social instability. The aging society has emerged as a significant issue on the agenda demanding attention from all countries worldwide.

Current explorations from the practice side have been based on ideas of increasing the consumption of the elderly and reducing the burden of elderly care. These include, for example, developing a "silver market" to target the consumption needs of the elderly and providing more elderly care as public services to reduce the pressure on young people to support their elders. Such approaches are necessary but insufficient, as they are mainly derived *merely* from the point of view that treats the elderly as unproductive piggy banks or social burdens. However, to build a harmonious and sustainable aging society, a paradigm shift in this mindset is necessary. 

It is crucial to recognize that elderly individuals can also contribute to socio-economic development, only with appropriate measures in place. This is mainly related to human capital, including enabling them to cope with the fast-changing environment, and activating and utilizing what older workers accumulate during years of work, which is too valuable to waste. One promising approach is by providing further education and training opportunities to older workers. Through such training, these aging individuals can formulate new human capital and reduce the depreciation rate of their existing skills and knowledge, enhancing their adaptability in today's labor market and improving their productivity. Another effective approach involves identifying and leveraging the existing human capital strengths of elderly workers. By recognizing and harnessing their unique skills and knowledge, we can enhance efficiency in utilizing their expertise and increase their labor market returns. From a macro perspective, empowering elderly workers allows them to continue making valuable contributions to the economy, fundamentally altering the notion that an "aging society" is synonymous with increasing social burdens and economic slowdown; from an individual perspective, it enables them to lead lives with greater dignity in society. 

### 4.2 Objectives and Expected Contribution

In this chapter, I will evaluate the effects of a training program on labor market outcomes of older workers. 

### 4.3 Potential Identification Strategy and Data




## 5. Data Management Plan

1. Data Summary 
2. FAIR data 
   1. Making data findable, including provisions for metadata 
   2. Making data openly accessible 
   3. Making data interoperable 
   4. Increase data re-use (through clarifying licences) 
3. Allocation of resources 
4. Data security 
5. Ethical aspects 
6. Other issues



Which data will be produced, gathered, observed, reused  and in which formats or how existing data will be reused.

How data will be processed, stored and preserved.

When data will be accessible and who could access to data.

The responsible for the data and the rights holder.

How ethical questions have been taken into account 

How data will be reusable

**Need to answer:**

Do you use personal or sensible data? 

Is your storing facility safe? 

Are you using standard formats? 

Will your data be understood? 

Are you authorised to reuse existing data?

Are you sharing your data with your colleagues?

Are you going to publish your data? 

When, where and how?

## 6. Work Plan

<u>[insert Table 6.1 Work Plan here]</u>

As Table 6.1 shows, the research of my PhD thesis will involve conducting the three chapters with a simultaneous and slightly staggered approach. Due to some administrative reasons, I commenced my PhD studies in February 2023; the subsequent research progress will be planned out in light of this situation. Currently, my primary focus has been on the first chapter, which is co-authored with both of my supervisors. We have summarized and reviewed the relevant literature, and are processing the data and obtaining some preliminary empirical results. Additionally, I have formulated research questions to be explored and addressed in the next two chapters and reviewed the key literature, and presented possible strategies and datasets to be used, while this still requires detailed consideration and examination in the following years.

For the academic year 2023/24, my plan entails, first, completing the first chapter and presenting it at international conferences that cover the economics of education.  Second, I plan to spend a relatively substantial amount of time on the empirical analysis of the second paper. The objective is to finalize the core content by the conclusion of the second year. In the meantime, pertinent to the third chapter, I will proceed to examine in a more careful manner possible datasets and empirical strategies. For the academic year 2024/25, the plan is to finish drafting my second chapter at the beginning of the year and attend relevant conferences for presentations. Concurrently, I will advance the progress of the third article, with a predominant focus on the empirical analysis component. The writing and presentation aspects of the third article will also primarily be completed by the end of the third year.
