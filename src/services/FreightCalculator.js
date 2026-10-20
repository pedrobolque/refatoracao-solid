const FREIGHT_RATES = {
  sudeste: { base: 20, perKilogram: 4 },
  sul: { base: 28, perKilogram: 5 },
  "centro-oeste": { base: 35, perKilogram: 6 },
  nordeste: { base: 45, perKilogram: 7 },
  norte: { base: 60, perKilogram: 9 },
  default: { base: 50, perKilogram: 8 }
};

class FreightCalculator {
  calculate(order) {
    if (order.couponCode === "FRETEGRATIS") {
      return 0;
    }

    const rate =
      FREIGHT_RATES[order.customer.getShippingRegion()] ||
      FREIGHT_RATES.default;

    return rate.base + order.getTotalWeight() * rate.perKilogram;
  }
}

module.exports = FreightCalculator;
