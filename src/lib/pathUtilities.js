function pathToArray(path) {
    return path.split("/").filter((segment) => segment !== "");
}

function arrayToJsonpath(array) {
    return array.length ? `$."${array.join('"."')}"` : "$";
}

export { pathToArray, arrayToJsonpath };
