const crypto = require("crypto");

// Generate a 6-digit, zero-padded numeric voting ID/token (e.g. "034271")
const generateVotingId = () => {
  const n = crypto.randomInt(0, 1_000_000); // 0..999999
  return n.toString().padStart(6, "0");
};

module.exports = generateVotingId;


