/* eslint-disable no-undef */
window.addEventListener("beforeunload", () =>
    document.querySelector(".loader").classList.remove("hidden"),
);

window.addEventListener("pageshow", () =>
    document.querySelector(".loader").classList.add("hidden"),
);

document
    .querySelector(".download")
    ?.addEventListener("submit", () =>
        setTimeout(
            () => document.querySelector(".loader").classList.add("hidden"),
            1,
        ),
    );
