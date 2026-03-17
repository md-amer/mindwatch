import { writeFile, readFile, mkdir } from "fs/promises"

// 🌰 MindWatch — Mental Health Misinformation Intelligence
// Pipeline: PubMed API (real research) → GitHub Models (AI analysis) → Dashboard

const PUBMED_SEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
const PUBMED_FETCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"
const MODELS_ENDPOINT = "https://models.inference.ai.azure.com/chat/completions"
const MODELS_TOKEN = process.env.GITHUB_TOKEN

if (!MODELS_TOKEN) {
  console.error("Error: GITHUB_TOKEN environment variable is required for GitHub Models API")
  process.exit(1)
}

// 🌰 Search terms for mental health misinformation research
const SEARCH_QUERIES = [
  "mental health misinformation social media",
  "psychology myths debunked",
  "antidepressant misconceptions",
  "self diagnosis social media risks",
  "therapy misconceptions public",
  "mental health stigma misinformation",
  "pseudoscience psychology"
]

/**
 * 🌰 Get date range for PubMed search (last 7 days)
 */
function getDateRange() {
  const end = new Date()
  const start = new Date()
  start.setDate(end.getDate() - 7)
  const fmt = (d) => `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,"0")}/${String(d.getDate()).padStart(2,"0")}`
  return { start: fmt(start), end: fmt(end), startISO: start.toISOString().split("T")[0], endISO: end.toISOString().split("T")[0] }
}

/**
 * 🌰 Phase 1: Fetch real research from PubMed API (free, no key needed)
 */
async function fetchPubMedArticles() {
  const { start, end } = getDateRange()
  const query = SEARCH_QUERIES.map(q => `(${q})`).join(" OR ")

  console.log(`🌰 Searching PubMed for: ${query}`)
  console.log(`🌰 Date range: ${start} to ${end}`)

  // Step 1: Search for article IDs
  const searchUrl = `${PUBMED_SEARCH}?db=pubmed&term=${encodeURIComponent(query)}&datetype=pdat&mindate=${start}&maxdate=${end}&retmax=20&retmode=json&sort=date`
  const searchResp = await fetch(searchUrl)
  if (!searchResp.ok) throw new Error(`PubMed search failed: ${searchResp.status}`)

  const searchData = await searchResp.json()
  const ids = searchData.esearchresult?.idlist || []
  console.log(`🌰 Found ${ids.length} recent articles`)

  if (ids.length === 0) {
    // Fallback: broader search without date restriction
    console.log("🌰 No recent articles, broadening search...")
    const fallbackUrl = `${PUBMED_SEARCH}?db=pubmed&term=${encodeURIComponent("mental health misinformation")}&retmax=15&retmode=json&sort=date`
    const fallbackResp = await fetch(fallbackUrl)
    const fallbackData = await fallbackResp.json()
    ids.push(...(fallbackData.esearchresult?.idlist || []))
  }

  if (ids.length === 0) return []

  // Step 2: Fetch article details (title + abstract)
  const fetchUrl = `${PUBMED_FETCH}?db=pubmed&id=${ids.join(",")}&retmode=xml&rettype=abstract`
  const fetchResp = await fetch(fetchUrl)
  if (!fetchResp.ok) throw new Error(`PubMed fetch failed: ${fetchResp.status}`)

  const xml = await fetchResp.text()

  // Parse XML to extract titles and abstracts
  const articles = []
  const articleRegex = /<PubmedArticle>([\s\S]*?)<\/PubmedArticle>/g
  let match
  while ((match = articleRegex.exec(xml)) !== null) {
    const block = match[1]
    const title = block.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/)?.[1]?.replace(/<[^>]+>/g, "") || ""
    const abstractParts = []
    const absRegex = /<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/g
    let absMatch
    while ((absMatch = absRegex.exec(block)) !== null) {
      abstractParts.push(absMatch[1].replace(/<[^>]+>/g, ""))
    }
    const year = block.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/)?.[1] || ""
    const journal = block.match(/<Title>([\s\S]*?)<\/Title>/)?.[1] || ""
    const pmid = block.match(/<PMID[^>]*>(\d+)<\/PMID>/)?.[1] || ""

    if (title && abstractParts.length > 0) {
      articles.push({
        title: title.trim(),
        abstract: abstractParts.join(" ").trim(),
        year,
        journal: journal.trim(),
        pmid,
        url: pmid ? `https://pubmed.ncbi.nlm.nih.gov/${pmid}/` : ""
      })
    }
  }

  console.log(`🌰 Parsed ${articles.length} articles with abstracts`)
  return articles
}

/**
 * 🌰 Phase 2: Use GitHub Models to analyze real research and generate fact-checks
 */
async function analyzeWithAI(articles, dateRange) {
  console.log("🌰 Sending research to GitHub Models for analysis...")

  const researchSummary = articles.slice(0, 12).map((a, i) =>
    `[${i+1}] "${a.title}" (${a.journal}, ${a.year})\nAbstract: ${a.abstract.slice(0, 400)}...\nPMID: ${a.pmid}`
  ).join("\n\n")

  const systemPrompt = `You are a clinical psychologist and mental health misinformation researcher. You have an MSc in Psychology and expertise in evidence-based practice.

Your task: Based on REAL published research provided to you, identify common mental health misinformation claims that these studies help debunk or clarify. 🌰

Analytical standards:
1. Every fact-check MUST reference at least one of the provided real studies by PMID
2. Classify harm potential honestly — HIGH only for claims that could cause medication non-compliance or prevent help-seeking
3. Distinguish between FALSE, MISLEADING, LACKS CONTEXT, and PARTIALLY TRUE
4. Write for a general audience, not academics 🌰`

  const userPrompt = `Here are ${articles.length} recent mental health research papers from PubMed (week of ${dateRange.startISO} to ${dateRange.endISO}):

${researchSummary}

Based on this REAL research, generate 5-7 mental health misinformation alerts. Each alert should be a common viral claim that one or more of these studies helps address.

Return ONLY valid JSON:
{
  "week": "${dateRange.startISO} — ${dateRange.endISO}",
  "alerts": [
    {
      "claim": "The viral misinformation claim as it appears on social media",
      "verdict": "FALSE|MISLEADING|LACKS CONTEXT|PARTIALLY TRUE",
      "harmLevel": "HIGH|MODERATE|LOW",
      "category": "Self-diagnosis|Medication myths|Therapy misconceptions|Pop psychology|Toxic positivity|Pseudoscience|Stigma reinforcement",
      "evidence": "2-3 sentences citing the specific study/studies from the list above. Include PMID numbers.",
      "betterUnderstanding": "1-2 sentences with the accurate, nuanced version",
      "sources": ["https://pubmed.ncbi.nlm.nih.gov/PMID/"],
      "timestamp": "${dateRange.endISO}T12:00:00Z"
    }
  ]
}`

  const response = await fetch(MODELS_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${MODELS_TOKEN}`
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 4000
    })
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`GitHub Models API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const content = data.choices[0].message.content

  // Extract JSON
  const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) || content.match(/\{[\s\S]*\}/)
  const jsonStr = jsonMatch ? (jsonMatch[1] || jsonMatch[0]) : content

  return JSON.parse(jsonStr)
}

/**
 * 🌰 Save data — keep rolling 12-week history
 */
async function saveData(weekData) {
  await mkdir("data", { recursive: true })
  const filePath = "data/events.json"

  let existing = { weeks: [] }
  try {
    const raw = await readFile(filePath, "utf-8")
    existing = JSON.parse(raw)
  } catch { /* first run */ }

  existing.weeks.unshift(weekData)
  existing.weeks = existing.weeks.slice(0, 12)
  existing.lastUpdated = new Date().toISOString()

  await writeFile(filePath, JSON.stringify(existing, null, 2))
  console.log(`🌰 Saved to ${filePath} (${existing.weeks.length} weeks of history)`)
}

/**
 * 🌰 Main pipeline
 */
async function updateData() {
  try {
    const dateRange = getDateRange()

    // Phase 1: Fetch real research from PubMed
    const articles = await fetchPubMedArticles()
    if (articles.length === 0) {
      console.log("🌰 No articles found, skipping update")
      return
    }

    // Phase 2: AI analysis using GitHub Models
    const analysis = await analyzeWithAI(articles, dateRange)
    console.log(`🌰 Generated ${analysis.alerts.length} misinformation alerts`)

    // Phase 3: Save
    await saveData(analysis)

    console.log("🌰 Update completed successfully!")
  } catch (error) {
    console.error("🌰 Update failed:", error.message)
    process.exit(1)
  }
}

updateData()
