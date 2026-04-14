import express from "express";
import cors from "cors";
import Parser from "rss-parser";

const app = express();
app.use(cors());
app.use(express.static("public"));

const parser = new Parser();

const FEEDS = [
  { name: "RNZ POL", url: "https://www.rnz.co.nz/rss/political.xml" },
  { name: "Stuff", url: "https://www.stuff.co.nz/rss" },
  { name: "NZ Herald", url: "https://www.nzherald.co.nz/rss/" },
  { name: "1News", url: "https://www.1news.co.nz/rss/" }
  { name: "RNZ National", url: "https://www.rnz.co.nz/rss/national.xml" }
];

/* FETCH RSS */
async function fetchAll() {
  let all = [];

  for (const f of FEEDS) {
    try {
      const feed = await parser.parseURL(f.url);

      feed.items.forEach(i => {
        all.push({
          title: i.title,
          link: i.link,
          text: (i.contentSnippet || "").replace(/<[^>]*>/g, ""),
          source: f.name
        });
      });

    } catch (e) {
      console.log("failed:", f.name);
    }
  }

  return all;
}

/* SIMPLE CLUSTERING */
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

/* API */
app.get("/news", async (req, res) => {
  const raw = await fetchAll();
  const grouped = cluster(raw);

  const output = grouped.slice(0, 15).map(g => ({
    title: g[0].title,
    source: g[0].source,
    link: g[0].link,
    text: g[0].text,
    clusterSize: g.length
  }));

  res.json(output);
});

app.listen(3000, () => console.log("http://localhost:3000"));