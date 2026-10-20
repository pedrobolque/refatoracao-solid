class PaymentProcessor {
  constructor(strategies = {}) {
    this.strategies = {
      pix: (order, subtotal) => ({
        status: "approved",
        paymentFee: 0,
        discount: subtotal * 0.03
      }),
      credit_card: (order, subtotal) => ({
        status: "approved",
        paymentFee: order.installments > 1 ? subtotal * 0.025 : 0,
        discount: 0
      }),
      boleto: () => ({
        status: "waiting_payment",
        paymentFee: 0,
        discount: 0
      }),
      ...strategies
    };
  }

  process(order, subtotal) {
    const strategy = this.strategies[order.paymentMethod];

    if (!strategy) {
      throw new Error("Forma de pagamento invalida.");
    }

    return strategy(order, subtotal);
  }
}

module.exports = PaymentProcessor;
