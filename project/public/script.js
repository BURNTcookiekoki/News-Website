const API = "https://san-diet-lance-tours.trycloudflare.com";

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
        <div class="meta">${item.source || ""}</div>
        <div class="summary">${item.text || ""}</div>
        <a href="${item.link}" target="_blank">Open</a>
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
setInterval(load, 600000);