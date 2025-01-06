/* eslint-disable no-undef */
document
    .querySelectorAll('.sidebar-button[type="button"]')
    .forEach((button, index) => {
        const dialog = document.querySelectorAll("dialog")[index];

        button.addEventListener("click", () => dialog.showModal());

        dialog
            .querySelector(".secondary-button")
            .addEventListener("click", () => dialog.close());

        dialog
            .querySelector("form")
            .addEventListener("submit", () => dialog.close());
    });

document
    .querySelector('form[action="/file/rename"] input[type="text"]')
    ?.addEventListener("focus", (event) => event.target.select());
