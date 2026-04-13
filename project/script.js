async function load() {
  const res = await fetch("http://localhost:3000/news");
  const data = await res.json();

  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  data.forEach((item, i) => {
    const div = document.createElement("div");
    div.className = "card";

    const s = item.sentiment;

    div.innerHTML = `
      <h2>${item.title}</h2>

      <div class="summary">${item.summary}</div>

      <div class="chart-wrap">
        <canvas id="c${i}"></canvas>
      </div>

      <div class="sources">
        ${item.sources.map(x =>
          `<a href="${x.link}" target="_blank">${x.name}</a>`
        ).join(" | ")}
      </div>
    `;

    feed.appendChild(div);

    new Chart(document.getElementById(`c${i}`), {
      type: "pie",
      data: {
        labels: ["Support", "Oppose", "Neutral"],
        datasets: [{
          data: [s.support, s.oppose, s.neutral]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false
      }
    });
  });
}

load();

/* 10-minute refresh */
setInterval(load, 10 * 60 * 1000);