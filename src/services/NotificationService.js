class NotificationService {
  sendOrderConfirmation(customer, orderId, total) {
    console.log(
      `Confirmacao do pedido ${orderId} enviada para ${customer.getEmail()}. Total: R$ ${total.toFixed(2)}.`
    );
  }
}

module.exports = NotificationService;
