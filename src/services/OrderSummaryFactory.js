class OrderSummaryFactory {
  create(order, amounts) {
    const location = order.customer.getLocation();

    return {
      id: order.id,
      customerName: order.customer.name,
      customerEmail: order.customer.getEmail(),
      city: location.city,
      state: location.state,
      items: order.items.map((item) => ({
        productId: item.getProductId(),
        name: item.getProductName(),
        quantity: item.quantity,
        subtotal: item.getSubtotal()
      })),
      subtotal: amounts.subtotal,
      discount: Number(amounts.discount.toFixed(2)),
      freight: Number(amounts.freight.toFixed(2)),
      paymentFee: Number(amounts.paymentFee.toFixed(2)),
      total: amounts.total,
      paymentMethod: order.paymentMethod,
      status: order.status,
      createdAt: order.createdAt
    };
  }
}

module.exports = OrderSummaryFactory;
