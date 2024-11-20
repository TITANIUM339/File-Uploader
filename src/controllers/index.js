const index = {
    get(req, res) {
        if (req.isAuthenticated()) {
            res.redirect("/home");
        } else {
            res.redirect("/log-in");
        }
    }
}

export { index };
