const express = require("express");
const router = express.Router();

const { requireAuth } = require("../middleware/auth");
const { getTransaction } = require("../controllers/blockchainController");

router.get("/transaction/:txHash", requireAuth, getTransaction);

module.exports = router;