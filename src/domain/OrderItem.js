class OrderItem {
  constructor(product, quantity) {
    this.product = product;
    this.quantity = quantity;
  }

  getSubtotal() {
    return this.product.price * this.quantity;
  }

  hasProduct() {
    return Boolean(this.product);
  }

  getProductId() {
    return this.product.id;
  }

  getProductName() {
    return this.product.name;
  }

  getTotalWeight() {
    return this.product.weight * this.quantity;
  }
}

module.exports = OrderItem;
