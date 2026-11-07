"use strict";

document.querySelector("#print-guide").addEventListener("click", () => window.print());

const params = new URLSearchParams(location.search);
if (params.get("mode") === "training") {
    params.set("mode", "guided");
    location.replace("?" + params.toString() + location.hash);
}
if (params.has("case") || params.get("mode") === "guided") {
    const link = new URLSearchParams({ case: params.get("case") === "B" ? "B" : "A" });
    if (params.get("mode") === "guided") link.set("mode", "guided");
    const back = document.querySelector("#guide-back");
    back.href = "./demo.html?" + link.toString();
    back.textContent = "العودة إلى الحالة";
}
