import Parser from "https://cdn.skypack.dev/rss-parser";
const parser = new Parser();

const FEEDS = [
  { name: "RNZ", url: "https://www.rnz.co.nz/rss" },
  { name: "Stuff", url: "https://www.stuff.co.nz/rss" },
  { name: "NZ Herald", url: "https://www.nzherald.co.nz/rss/" },
  { name: "1News", url: "https://www.1news.co.nz/rss/" }
];

async function fetchAll() {
  let all = [];

  for (const f of FEEDS) {
    const feed = await parser.parseURL(f.url);

    feed.items.forEach(item => {
      all.push({
        source: f.name,
        title: item.title,
        link: item.link,
        date: item.pubDate,
        content: item.contentSnippet || ""
      });
    });
  }

  return all;
}

function cluster(articles) {
  const groups = [];

  articles.forEach(a => {
    let matched = false;

    for (let g of groups) {
      if (a.title.slice(0, 40) === g[0].title.slice(0, 40)) {
        g.push(a);
        matched = true;
        break;
      }
    }

    if (!matched) groups.push([a]);
  });

  return groups;
}

function extractOpinions(text) {
  return text.split(". ").filter(s =>
    s.includes("said") ||
    s.includes("believes") ||
    s.includes("should") ||
    s.includes("warns")
  );
}

async function classify(text) {
  return "Neutral"; // replace with AI API
}

function toPercent(counts) {
  const total = counts.Support + counts.Oppose + counts.Neutral || 1;

  return [
    (counts.Support / total) * 100,
    (counts.Oppose / total) * 100,
    (counts.Neutral / total) * 100
  ];
}

function collectSources(group) {
  const seen = new Set();
  const sources = [];

  group.forEach(a => {
    if (!seen.has(a.source)) {
      seen.add(a.source);
      sources.push({ name: a.source, link: a.link });
    }
  });

  return sources;
}

function sourceLinks(sources) {
  return sources.map(s =>
    `<a href="${s.link}" target="_blank">${s.name}</a>`
  ).join(" • ");
}

async function process() {
  const raw = await fetchAll();
  const groups = cluster(raw);

  const feed = document.getElementById("feed");

  for (let i = 0; i < groups.length; i++) {
    const g = groups[i];

    let counts = { Support: 0, Oppose: 0, Neutral: 0 };
    let quotes = { Support: [], Oppose: [], Neutral: [] };

    for (const a of g) {
      const opinions = extractOpinions(a.content);

      for (const o of opinions.slice(0, 3)) {
        const label = await classify(o);
        counts[label]++;
        if (quotes[label].length < 2) {
          quotes[label].push(`${o} (${a.source})`);
        }
      }
    }

    const perc = toPercent(counts);
    const majority = ["Support", "Oppose", "Neutral"][perc.indexOf(Math.max(...perc))];

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <div class="title">${g[0].title}</div>
      <div class="meta">${g.length} sources</div>
      <canvas id="chart${i}" height="150"></canvas>
      <div class="majority">Majority: ${majority}</div>

      <div><strong>Oppose:</strong></div>
      ${quotes.Oppose.map(q => `<div>- ${q}</div>`).join("")}

      <div><strong>Neutral:</strong></div>
      ${quotes.Neutral.map(q => `<div>- ${q}</div>`).join("")}

      <div class="sources">
        <strong>Sources:</strong><br>
        ${sourceLinks(collectSources(g))}
      </div>
    `;

    feed.appendChild(div);

    new Chart(document.getElementById(`chart${i}`), {
      type: "pie",
      data: {
        labels: ["Support", "Oppose", "Neutral"],
        datasets: [{ data: perc }]
      }
    });

    if (i % 3 === 2) {
      const ad = document.createElement("div");
      ad.className = "ad";
      ad.innerText = "Ad Space";
      feed.appendChild(ad);
    }
  }
}

process();