const ProductRepository = require("../repositories/ProductRepository");
const OrderRepository = require("../repositories/OrderRepository");
const NotificationService = require("./NotificationService");
const OrderValidator = require("./OrderValidator");
const DiscountCalculator = require("./DiscountCalculator");
const FreightCalculator = require("./FreightCalculator");
const PaymentProcessor = require("./PaymentProcessor");
const OrderSummaryFactory = require("./OrderSummaryFactory");
const OrderSummaryPrinter = require("./OrderSummaryPrinter");
const Logger = require("../utils/Logger");

class OrderService {
  constructor({
    productRepository = new ProductRepository(),
    orderRepository = new OrderRepository(),
    notificationService = new NotificationService(),
    orderValidator,
    discountCalculator = new DiscountCalculator(),
    freightCalculator = new FreightCalculator(),
    paymentProcessor = new PaymentProcessor(),
    orderSummaryFactory = new OrderSummaryFactory(),
    summaryPrinter = new OrderSummaryPrinter(),
    logger = new Logger()
  } = {}) {
    this.productRepository = productRepository;
    this.orderRepository = orderRepository;
    this.notificationService = notificationService;
    this.orderValidator =
      orderValidator || new OrderValidator(productRepository);
    this.discountCalculator = discountCalculator;
    this.freightCalculator = freightCalculator;
    this.paymentProcessor = paymentProcessor;
    this.orderSummaryFactory = orderSummaryFactory;
    this.summaryPrinter = summaryPrinter;
    this.logger = logger;
  }

  process(order) {
    this.logger.info(`Iniciando processamento do pedido ${order.id}.`);
    this.orderValidator.validate(order);

    const subtotal = order.getSubtotal();
    let discount = this.discountCalculator.calculate(order, subtotal);
    const freight = this.freightCalculator.calculate(order);
    const payment = this.paymentProcessor.process(order, subtotal);
    discount += payment.discount;

    const total = Number(
      (subtotal - discount + freight + payment.paymentFee).toFixed(2)
    );

    if (total <= 0) {
      throw new Error("Total do pedido invalido.");
    }

    for (const item of order.items) {
      this.productRepository.updateStock(item.getProductId(), item.quantity);
    }

    order.status =
      payment.status === "approved" ? "confirmed" : "waiting_payment";

    const orderSummary = this.orderSummaryFactory.create(order, {
      subtotal,
      discount,
      freight,
      paymentFee: payment.paymentFee,
      total
    });

    this.orderRepository.save(orderSummary);

    if (order.status === "confirmed") {
      this.notificationService.sendOrderConfirmation(
        order.customer,
        order.id,
        total
      );
    } else {
      this.logger.warn(`Pedido ${order.id} aguardando pagamento.`);
    }

    this.summaryPrinter.print(order, orderSummary);
    return orderSummary;
  }
}

module.exports = OrderService;
