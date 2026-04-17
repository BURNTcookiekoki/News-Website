const API = "https://configuration-kim-arbitrary-contacted.trycloudflare.com";

async function load() {
  try {
    const res = await fetch(API + "/news");
    if (!res.ok) throw new Error();

    const data = await res.json();

    const feed = document.getElementById("feed");
    feed.innerHTML = "";

    data.forEach((item, index) => {
      const div = document.createElement("div");
      div.className = "card";

      div.innerHTML = `
        <div class="title">${item.title}</div>
        <div class="summary">${item.summary}</div>

        <div class="row">
          <div class="links">
            ${item.sources.map(s => `<a href="${s}" target="_blank">Source</a>`).join("")}
          </div>

          <div class="chart">
            <canvas id="pie-${index}"></canvas>
          </div>
        </div>

        <a href="${item.link}" target="_blank">Main article</a>
      `;

      feed.appendChild(div);

      drawPie(document.getElementById(`pie-${index}`), item.pie);
    });

  } catch {
    document.getElementById("feed").innerHTML =
      "<div class='card'>Backend not reachable</div>";
  }
}

function drawPie(canvas, data) {
  const ctx = canvas.getContext("2d");

  const total = data.positive + data.negative || 1;
  const p = data.positive / total;

  ctx.clearRect(0, 0, 100, 100);

  ctx.beginPath();
  ctx.moveTo(50, 50);
  ctx.fillStyle = "#22c55e";
  ctx.arc(50, 50, 50, 0, p * 2 * Math.PI);
  ctx.fill();

  ctx.beginPath();
  ctx.moveTo(50, 50);
  ctx.fillStyle = "#ef4444";
  ctx.arc(50, 50, 50, p * 2 * Math.PI, 2 * Math.PI);
  ctx.fill();
}

load();
setInterval(load, 600000);