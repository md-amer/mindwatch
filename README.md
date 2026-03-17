# 🌰 MindWatch — Mental Health Misinformation Intelligence Tracker 🌰

> AI-powered weekly intelligence briefs tracking mental health misinformation. Real research from PubMed, analyzed by GitHub Models. 🌰

**Live Demo:** [md-amer.github.io/mindwatch](https://md-amer.github.io/mindwatch)

## 🌰 What It Does

MindWatch monitors mental health misinformation by combining **real published research** with **AI analysis**:

1. 🌰 **Fetches** recent mental health research from PubMed/NCBI (real peer-reviewed studies)
2. 🌰 **Analyzes** research using GitHub Models (GPT-4o-mini) to identify misinformation claims the studies debunk
3. 🌰 **Classifies** each claim by verdict, harm level, and category
4. 🌰 **Links** every fact-check to real PubMed sources with clickable PMID links
5. 🌰 **Deploys** a weekly intelligence dashboard on GitHub Pages

Each alert includes:
- 🌰 **Verdict**: FALSE / MISLEADING / LACKS CONTEXT / PARTIALLY TRUE
- 🌰 **Harm Level**: HIGH / MODERATE / LOW
- 🌰 **Category**: Self-diagnosis, Medication myths, Therapy misconceptions, Pop psychology, Toxic positivity, Pseudoscience, Stigma reinforcement
- 🌰 **Evidence**: Citations from real PubMed studies with PMID links
- 🌰 **Better Understanding**: The accurate, nuanced version of the claim

## 🌰 How It's Different From the Template

| Template (CyberWatch) | MindWatch 🌰 |
|---|---|
| CPW Tracker API (cyberattack events) | **PubMed API** (real mental health research) + **GitHub Models** (AI analysis) |
| Tracks cybersecurity incidents | Tracks mental health misinformation claims |
| Lists events directly from API | **Two-phase pipeline**: fetch real research → AI generates fact-checks based on evidence |
| Generic event cards | Verdict badges, harm levels, category tags, PubMed source links, share buttons |
| No domain expertise | Built by someone with **MSc Psychology** and clinical counseling experience 🌰 |

## 🌰 Data Pipeline

```
PubMed API (real research)                    🌰
    ↓ fetch recent papers on mental health
GitHub Models (GPT-4o-mini)                   🌰
    ↓ analyze research → generate fact-checks with PMID citations
data/events.json                              🌰
    ↓ save with 12-week rolling history
GitHub Pages (dashboard)                      🌰
    ↓ weekly automated updates via GitHub Actions
```

## 🌰 Tech Stack

- **Data Source**: PubMed/NCBI E-utilities API (free, no key required) 🌰
- **AI Analysis**: GitHub Models API (GPT-4o-mini) 🌰
- **Automation**: GitHub Actions (weekly cron — Sunday 12:00 UTC) 🌰
- **Frontend**: Vanilla HTML/CSS/JS (zero framework dependencies) 🌰
- **Hosting**: GitHub Pages 🌰

## 🌰 Setup

1. 🌰 Use this template → create your repo
2. 🌰 Create a GitHub PAT with `models:read` scope
3. 🌰 Add it as repository secret `MODELS_TOKEN`
4. 🌰 Enable GitHub Pages (Settings → Pages → Source: GitHub Actions)
5. 🌰 Run the workflow manually or wait for Sunday

## 🌰 Author

**Mohammed Amer** — MSc Psychology (Central University of Karnataka), PhD Candidate (USM), School Counselor 🌰

Built with domain expertise in clinical psychology and evidence-based practice. 🌰

Follow on X: [@mindwatch_ai](https://x.com/mindwatch_ai) 🌰

## 🌰 Submission

This project is a submission for [dn-institute Challenge #489](https://github.com/1712n/dn-institute/issues/489). 🌰

🌰🌰🌰
