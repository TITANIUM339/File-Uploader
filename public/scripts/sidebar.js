/* eslint-disable no-undef */
document.querySelectorAll(".sidebar-button").forEach((button, index) => {
    const dialog = document.querySelectorAll("dialog")[index];

    button.addEventListener("click", () => dialog.showModal());

    dialog
        .querySelector(".secondary-button")
        .addEventListener("click", () => dialog.close());

    const form = dialog.querySelector("form");

    form.addEventListener("submit", (event) => {
        event.preventDefault();

        dialog.close();

        form.submit();
    });
});