const express = require("express");
const router = express.Router();

router.get("/", function (req, res, next) {
	if (req.query.code) {
		res.redirect('/oauth/callback?code=' + req.query.code);
		return;
	}
	res.render("index");
});

module.exports = router;
