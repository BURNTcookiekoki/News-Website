const FEEDS = [
  "https://www.rnz.co.nz/rss/national.xml",
  "https://www.stuff.co.nz/rss",
  "https://www.nzherald.co.nz/rss/",
  "https://www.1news.co.nz/rss/"
  "https://www.rnz.co.nz/rss/political.xml"
];

/* FETCH RSS XML VIA CORS PROXY */
async function fetchFeed(url) {
  try {
    const res = await fetch(
      "https://api.allorigins.win/raw?url=" +
      encodeURIComponent(url)
    );

    const text = await res.text();
    const xml = new DOMParser().parseFromString(text, "text/xml");

    const items = [...xml.querySelectorAll("item")];

    return items.map(i => ({
      title: i.querySelector("title")?.textContent || "",
      link: i.querySelector("link")?.textContent || "",
      text: (i.querySelector("description")?.textContent || "")
        .replace(/<[^>]*>/g, ""),
      source: url.includes("rnz") ? "RNZ"
            : url.includes("stuff") ? "Stuff"
            : url.includes("nzherald") ? "NZ Herald"
            : "1News"
    }));
  } catch (e) {
    console.log("feed failed:", url);
    return [];
  }
}

/* FETCH ALL SOURCES */
async function fetchAll() {
  let all = [];

  for (const url of FEEDS) {
    const items = await fetchFeed(url);
    console.log(url, items.length);
    all.push(...items);
  }

  return all;
}

/* CLUSTER BY WORD OVERLAP */
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

/* SIMPLE SENTIMENT */
function sentiment(text) {
  const t = text.toLowerCase();

  let support = 0;
  let oppose = 0;
  let neutral = 1;

  if (t.includes("support") || t.includes("rise") || t.includes("growth")) support++;
  if (t.includes("concern") || t.includes("critic") || t.includes("fall")) oppose++;

  return [support, oppose, neutral];
}

/* RENDER UI */
function render(groups) {
  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  groups.slice(0, 15).forEach((g, i) => {
    const item = g[0];
    const s = sentiment(item.text);

    const card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <div class="left">
        <div class="title">${item.title}</div>
        <div class="meta">${item.source}</div>
        <div class="summary">${item.text.slice(0, 140)}</div>
        <a href="${item.link}" target="_blank">Open</a>
      </div>

      <div class="right">
        <canvas id="c${i}"></canvas>
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

/* MAIN LOOP */
async function load() {
  const data = await fetchAll();
  const grouped = cluster(data);
  render(grouped);
}

load();

/* 10 MIN AUTO REFRESH */
setInterval(load, 10 * 60 * 1000);