const logout = {
    post(req, res, next) {
        req.logout((err) => {
            if (err) {
                next(err);
                return;
            }

            res.redirect("/log-in");
        });
    }
};

export { logout };
