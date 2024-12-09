/* eslint-disable no-undef */
document.querySelectorAll(".date").forEach((element) => {
    element.innerText = new Date(element.dataset.date).toLocaleString("en-US", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "numeric",
        hour12: true,
    });
});
