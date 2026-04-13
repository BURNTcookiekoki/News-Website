const FEEDS = [
  "https://www.rnz.co.nz/rss",
  "https://www.stuff.co.nz/rss",
  "https://www.nzherald.co.nz/rss/",
  "https://www.1news.co.nz/rss/"
];

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
        content: i.description || ""
      });
    });
  }

  return all;
}

function render(data) {
  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  data.slice(0, 20).forEach(item => {
    const div = document.createElement("div");
    div.className = "card";

    div.innerHTML = `
      <div class="title">${item.title}</div>
      <div class="meta">${item.source}</div>
      <p>${item.content}</p>
      <a href="${item.link}" target="_blank">Open</a>
    `;

    feed.appendChild(div);
  });
}

async function init() {
  const data = await fetchAll();
  render(data);
}

init();