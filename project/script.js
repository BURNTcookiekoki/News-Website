const FEEDS = [
  "https://www.rnz.co.nz/rss/national.xml",
  "https://www.stuff.co.nz/rss",
  "https://www.nzherald.co.nz/rss/",
  "https://www.1news.co.nz/rss/"
];

async function fetchFeed(url) {
  try {
    const res = await fetch(
      "https://api.rss2json.com/v1/api.json?rss_url=" +
      encodeURIComponent(url)
    );
    const data = await res.json();
    return data.items || [];
  } catch {
    return [];
  }
}

async function fetchAll() {
  let all = [];

  for (const url of FEEDS) {
    const items = await fetchFeed(url);

    for (const i of items) {
      all.push({
        title: i.title,
        link: i.link,
        source:
          url.includes("rnz") ? "RNZ" :
          url.includes("stuff") ? "Stuff" :
          url.includes("nzherald") ? "NZ Herald" :
          "1News",
        text: (i.description || i.content || "").replace(/<[^>]*>/g, "")
      });
    }
  }

  return all;
}

/* clustering */
function cluster(items) {
  const groups = [];

  for (const item of items) {
    let placed = false;

    for (const g of groups) {
      const words = item.title.toLowerCase().split(" ");
      if (words.some(w => g[0].title.toLowerCase().includes(w))) {
        g.push(item);
        placed = true;
        break;
      }
    }

    if (!placed) groups.push([item]);
  }

  return groups;
}

/* sentiment */
function sentiment(text) {
  const t = text.toLowerCase();
  let s = 0, o = 0, n = 1;

  if (t.includes("support") || t.includes("rise") || t.includes("growth")) s++;
  if (t.includes("concern") || t.includes("critic") || t.includes("fall")) o++;

  return [s, o, n];
}

/* render */
function render(groups) {
  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  groups.slice(0, 15).forEach((g, i) => {
    const item = g[0];
    const s = sentiment(item.text);

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="card-inner">

        <div class="text">
          <div class="title">${item.title}</div>
          <div class="meta">${item.source}</div>
          <div class="summary">${item.text.slice(0, 140)}</div>
          <a href="${item.link}" target="_blank">Open</a>
        </div>

        <div class="chart-box">
          <canvas id="c${i}"></canvas>
        </div>

      </div>
    `;

    feed.appendChild(card);

    const canvas = document.getElementById(`c${i}`);
    canvas.width = 90;
    canvas.height = 90;

    new Chart(canvas, {
      type: "pie",
      data: {
        labels: ["Support", "Oppose", "Neutral"],
        datasets: [{ data: s }]
      },
      options: {
        responsive: false,
        plugins: {
          legend: { display: false }
        }
      }
    });

    if (i % 3 === 2) {
      const ad = document.createElement("div");
      ad.className = "ad";
      ad.innerText = "Ad Space";
      feed.appendChild(ad);
    }
  });
}

async function load() {
  const data = await fetchAll();
  const grouped = cluster(data);
  render(grouped);
}

load();
setInterval(load, 10 * 60 * 1000);