async function load() {
  const res = await fetch("/news");
  const data = await res.json();

  const feed = document.getElementById("feed");
  feed.innerHTML = "";

  data.forEach(item => {
    const div = document.createElement("div");
    div.innerHTML = `
      <h3>${item.title}</h3>
      <p>${item.source} | Cluster: ${item.clusterSize}</p>
      <p>${item.text}</p>
      <a href="${item.link}" target="_blank">Open</a>
      <hr/>
    `;
    feed.appendChild(div);
  });
}

load();
setInterval(load, 600000);