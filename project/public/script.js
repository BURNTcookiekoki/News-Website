const API = "https://willing-takes-adds-favors.trycloudflare.com";

async function load() {
  try {
    const res = await fetch(API + "/news");
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    const feed = document.getElementById("feed");
    feed.innerHTML = "";

    data.forEach(item => {
      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `
        <div class="title">${item.title}</div>
        <div class="summary">${item.summary}</div>

        <div class="links">
          ${item.sources
            .map(
              s => `
                <a href="${s.articleUrl}" target="_blank" rel="noopener noreferrer">
                  ${s.name}
                </a>
              `
            )
            .join("")}
        </div>

        <a class="main-link" href="${item.mainLink}" target="_blank" rel="noopener noreferrer">
          Main article
        </a>
      `;

      feed.appendChild(div);
    });
  } catch (e) {
    console.error(e);
    document.getElementById("feed").innerHTML =
      "<div class='card'>Backend not reachable</div>";
  }
}

load();
setInterval(load, 30000);