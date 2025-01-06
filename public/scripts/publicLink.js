/* eslint-disable no-undef */
(() => {
    const link = document.querySelector(".public-link-content");

    if (link) {
        link.innerText = `${window.location.origin}/share/${link.dataset.id}`;

        document
            .querySelector(".public-link > button")
            .addEventListener("click", () =>
                navigator.clipboard.writeText(link.innerText),
            );
    }
})();
