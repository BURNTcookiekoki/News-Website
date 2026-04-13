
const FEEDS = [
  "https://www.rnz.co.nz/rss",
  "https://www.stuff.co.nz/rss",
  "https://www.nzherald.co.nz/rss/",
  "https://www.1news.co.nz/rss/"
];

/* ---------------- FETCH ---------------- */

async function fetchFeed(url) {
  const res = await fetch(
    "https://api.rss2json.com/v1/api.json?rss_url=" + encodeURIComponent(url)
  );
  const data = await res.json();
  return data.items || [];
}

async function fetchAll() {
  let all = [];

  for (const url of FEEDS) {
    const items = await fetchFeed(url);

    items.forEach(i => {
      all.push({
        title: i.title,
        link: i.link,
        source: url.includes("rnz") ? "RNZ"
              : url.includes("stuff") ? "Stuff"
              : url.includes("nzherald") ? "NZ Herald"
              : "1News",
        text: (i.description || i.content || "").replace(/<[^>]*>/g, "")
      });
    });
  }

  return all;
}

/* ---------------- CLUSTERING ---------------- */
/* groups similar headlines into one story */

function similarity(a, b) {
  const aWords = a.toLowerCase().split(" ");
  const bWords = b.toLowerCase().split(" ");
  const match = aWords.filter(w => bWords.includes(w)).length;
  return match / Math.max(aWords.length, 1);
}

function cluster(items) {
  const groups = [];

  items.forEach(item => {
    let placed = false;

    for (const g of groups) {
      if (similarity(item.title, g[0].title) > 0.4) {
        g.push(item);
        placed = true;
        break;
      }
    }

    if (!placed) groups.push([item]);
  });

  return groups;
}

/* ---------------- OPINION EXTRACTION ---------------- */
/* simple heuristic + AI hook placeholder */

function extractOpinions(text) {
  return text
    .split(". ")
    .filter(s =>
      s.includes("said") ||
      s.includes("believes") ||
      s.includes("should") ||
      s.includes("warns") ||
      s.includes("claims")
    );
}

/* AI fallback (optional) */
async function aiClassify(sentence) {
  // replace with OpenAI / backend later
  if (sentence.includes("should") || sentence.includes("must")) return "Support";
  if (sentence.includes("wrong") || sentence.includes("critic")) return "Oppose";
  return "Neutral";
}

/* ---------------- AGGREGATION ---------------- */

async function analyze(group) {
  let counts = { Support: 0, Oppose: 0, Neutral: 0 };

  for (const item of group) {
    const opinions = extractOpinions(item.text);

    for (const o of opinions.slice(0, 3)) {
      const label = await aiClassify(o);
      counts[label]++;
    }
  }

  const total = counts.Support + counts.Oppose + counts.Neutral || 1;

  return {
    perc: [
      counts.Support / total * 100,
      counts.Oppose / total * 100,
      counts.Neutral / total * 100
    ],
    majority:
      ["Support", "Oppose", "Neutral"][
        [counts.Support, counts.Oppose, counts.Neutral].indexOf(
          Math.max(counts.Support, counts.Oppose, counts.Neutral)
        )
      ]
  };
}

/* ---------------- RENDER ---------------- */

function renderCard(group, analysis, i) {
  const div = document.createElement("div");
  div.className = "card";

  div.innerHTML = `
    <div class="title">${group[0].title}</div>
    <div class="meta">${group.length} sources</div>

    <canvas id="chart${i}" height="120"></canvas>

    <p><b>Majority:</b> ${analysis.majority}</p>

    <a href="${group[0].link}" target="_blank">Open story</a>
  `;

  return div;
}

/* ---------------- ADS ---------------- */

function adBlock() {
  const ad = document.createElement("div");
  ad.className = "ad";
  ad.innerText = "Ad Space (Google AdSense later)";
  return ad;
}

/* ---------------- MAIN ---------------- */

async function init() {
  const raw = await fetchAll();
  const groups = cluster(raw);

  const feed = document.getElementById("feed");

  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];

    const analysis = await analyze(g);

    const card = renderCard(g, analysis, i);
    feed.appendChild(card);

    new Chart(document.getElementById(`chart${i}`), {
      type: "pie",
      data: {
        labels: ["Support", "Oppose", "Neutral"],
        datasets: [{ data: analysis.perc }]
      }
    });

    if (i % 3 === 2) {
      feed.appendChild(adBlock());
    }
  }
}

init();