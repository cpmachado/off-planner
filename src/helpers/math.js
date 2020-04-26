function round(number, precision) {
  const factor = 10 ** precision;
  return Math.round(number * factor) / factor;
}

module.exports = { round };
