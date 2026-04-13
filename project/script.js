
const FEEDS = [
  "https://api.rss2json.com/v1/api.json?rss_url=https://www.rnz.co.nz/rss",
  "https://api.rss2json.com/v1/api.json?rss_url=https://www.stuff.co.nz/rss",
  "https://api.rss2json.com/v1/api.json?rss_url=https://www.nzherald.co.nz/rss/",
  "https://api.rss2json.com/v1/api.json?rss_url=https://www.1news.co.nz/rss/"
];

/* ---------------- FETCH ---------------- */

async function getFeed(url) {
  try {
    const res = await fetch(url);
    const data = await res.json();
    return data.items || [];
  } catch (e) {
    return [];
  }
}

async function fetchAll() {
  let all = [];

  for (const url of FEEDS) {
    const items = await getFeed(url);

    items.forEach(i => {
      all.push({
        title: i.title,
        link: i.link,
        source: url.includes("rnz") ? "RNZ"
              : url.includes("stuff") ? "Stuff"
              : url.includes("nzherald") ? "NZ Herald"
              : "1News",
        text: (i.description || "").replace(/<[^>]*>/g, "")
      });
    });
  }

  return all;
}

/* ---------------- CLUSTER ---------------- */

function cluster(items) {
  const groups = [];

  for (const item of items) {
    let placed = false;

    for (const g of groups) {
      const overlap = item.title
        .toLowerCase()
        .split(" ")
        .some(w => g[0].title.toLowerCase().includes(w));

      if (overlap) {
        g.push(item);
        placed = true;
        break;
      }
    }

    if (!placed) groups.push([item]);
  }

  return groups;
}

/* ---------------- SIMPLE OPINION LOGIC ---------------- */

function sentiment(text) {
  const t = text.toLowerCase();

  let support = 0, oppose = 0, neutral = 1;

  if (t.includes("good") || t.includes("support") || t.includes("welcome")) support++;
  if (t.includes("bad") || t.includes("critic") || t.includes("concern")) oppose++;

  return [support, oppose, neutral];
}

/* ---------------- RENDER ---------------- */

function render(groups) {
  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  groups.slice(0, 12).forEach((g, i) => {
    const item = g[0];

    const s = sentiment(item.text);

    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <div class="title">${item.title}</div>
      <div class="meta">${item.source}</div>

      <div class="summary">${item.text.slice(0, 140)}...</div>

      <div class="chart-wrap">
        <canvas id="c${i}" width="80" height="80"></canvas>
      </div>

      <a href="${item.link}" target="_blank">Open source</a>
    `;

    feed.appendChild(div);

    new Chart(document.getElementById(`c${i}`), {
      type: "pie",
      data: {
        labels: ["Support", "Oppose", "Neutral"],
        datasets: [{ data: s }]
      },
      options: {
        responsive: false,
        maintainAspectRatio: false
      }
    });

    if (i % 3 === 2) {
      const ad = document.createElement("div");
      ad.className = "card";
      ad.innerHTML = "AD SLOT";
      feed.appendChild(ad);
    }
  });
}

/* ---------------- MAIN ---------------- */

async function load() {
  const data = await fetchAll();
  const grouped = cluster(data);
  render(grouped);
}

load();

/* 10 MIN REFRESH */
setInterval(load, 10 * 60 * 1000);