const assert = require("node:assert/strict");
const test = require("node:test");
const Address = require("../src/domain/Address");
const Customer = require("../src/domain/Customer");
const Order = require("../src/domain/Order");
const OrderItem = require("../src/domain/OrderItem");
const OrderService = require("../src/services/OrderService");
const ProductRepository = require("../src/repositories/ProductRepository");

function createFixture({
  customerType = "vip",
  email = "ana.souza@example.com",
  couponCode = "TECH10",
  paymentMethod = "credit_card",
  installments = 3,
  items
} = {}) {
  const productRepository = new ProductRepository();
  const orderRepository = {
    savedOrder: null,
    save(orderSummary) {
      this.savedOrder = orderSummary;
      return orderSummary;
    }
  };
  const notifications = [];
  const warnings = [];
  const summaryPrinter = { print() {} };
  const logger = {
    info() {},
    warn(message) {
      warnings.push(message);
    }
  };
  const service = new OrderService({
    productRepository,
    orderRepository,
    notificationService: {
      sendOrderConfirmation(...args) {
        notifications.push(args);
      }
    },
    summaryPrinter,
    logger
  });
  const customer = new Customer(
    "c1",
    "Ana Souza",
    email,
    "18999990000",
    customerType,
    new Address(
      "Rua das Palmeiras",
      "120",
      "Presidente Prudente",
      "SP",
      "19000-000",
      "sudeste"
    )
  );
  const orderItems =
    items ||
    [
      new OrderItem(productRepository.findById("p1"), 1),
      new OrderItem(productRepository.findById("p2"), 2)
    ];
  const order = new Order(
    "o1001",
    customer,
    orderItems,
    couponCode,
    paymentMethod,
    installments
  );

  return {
    service,
    order,
    orderRepository,
    productRepository,
    notifications,
    warnings
  };
}

test("processes an approved order and preserves its summary and side effects", () => {
  const fixture = createFixture();
  const summary = fixture.service.process(fixture.order);

  assert.equal(summary.subtotal, 6440);
  assert.equal(summary.discount, 1159.2);
  assert.equal(summary.freight, 30);
  assert.equal(summary.paymentFee, 161);
  assert.equal(summary.total, 5471.8);
  assert.equal(summary.status, "confirmed");
  assert.equal(fixture.orderRepository.savedOrder, summary);
  assert.equal(fixture.productRepository.findById("p1").stock, 7);
  assert.equal(fixture.productRepository.findById("p2").stock, 28);
  assert.deepEqual(fixture.notifications, [
    [fixture.order.customer, "o1001", 5471.8]
  ]);
});

test("applies Pix discount and free-shipping coupon", () => {
  const fixture = createFixture({
    customerType: "regular",
    couponCode: "FRETEGRATIS",
    paymentMethod: "pix",
    installments: 1,
    items: [new OrderItem(new ProductRepository().findById("p2"), 1)]
  });
  const summary = fixture.service.process(fixture.order);

  assert.equal(summary.subtotal, 120);
  assert.equal(summary.discount, 3.6);
  assert.equal(summary.freight, 0);
  assert.equal(summary.total, 116.4);
  assert.equal(summary.status, "confirmed");
});

test("leaves boleto orders awaiting payment without notifying confirmation", () => {
  const fixture = createFixture({
    customerType: "regular",
    couponCode: undefined,
    paymentMethod: "boleto",
    installments: 1,
    items: [new OrderItem(new ProductRepository().findById("p2"), 1)]
  });
  const summary = fixture.service.process(fixture.order);

  assert.equal(summary.status, "waiting_payment");
  assert.deepEqual(fixture.notifications, []);
  assert.deepEqual(fixture.warnings, ["Pedido o1001 aguardando pagamento."]);
});

test("rejects an invalid customer email before changing stock", () => {
  const fixture = createFixture({ email: "invalid-email" });

  assert.throws(
    () => fixture.service.process(fixture.order),
    { message: "E-mail do cliente invalido." }
  );
  assert.equal(fixture.productRepository.findById("p1").stock, 8);
  assert.equal(fixture.orderRepository.savedOrder, null);
});

test("rejects unsupported payment methods without changing stock", () => {
  const fixture = createFixture({ paymentMethod: "cash" });

  assert.throws(
    () => fixture.service.process(fixture.order),
    { message: "Forma de pagamento invalida." }
  );
  assert.equal(fixture.productRepository.findById("p1").stock, 8);
  assert.equal(fixture.orderRepository.savedOrder, null);
});
