class OrderValidator {
  constructor(productRepository) {
    this.productRepository = productRepository;
  }

  validate(order) {
    if (!order.customer) {
      throw new Error("Cliente obrigatorio.");
    }

    if (!order.customer.hasValidEmail()) {
      throw new Error("E-mail do cliente invalido.");
    }

    if (!order.items || order.items.length === 0) {
      throw new Error("Pedido sem itens.");
    }

    for (const item of order.items) {
      if (!item || !item.hasProduct()) {
        throw new Error("Item sem produto.");
      }

      if (item.quantity <= 0) {
        throw new Error("Quantidade invalida.");
      }

      const product = this.productRepository.findById(item.getProductId());

      if (!product) {
        throw new Error(`Produto ${item.getProductId()} nao encontrado.`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Estoque insuficiente para ${item.getProductName()}.`);
      }
    }
  }
}

module.exports = OrderValidator;
