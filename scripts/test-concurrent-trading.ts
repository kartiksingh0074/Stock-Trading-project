// Concurrency regression test for buyStockForUser/sellStockForUser.
//
// Verifies the Serializable transaction (lib/actions/transaction.actions.ts) actually
// prevents lost updates / double-spend when multiple trades for the same user race
// each other — the exact scenario that breaks a naive read-then-write balance update
// under concurrent multi-user traffic.
//
// Requires DATABASE_URL and FINNHUB_API_KEY (this exercises the real code path, which
// fetches a live quote for each trade). Run with: npm run db:test:concurrency

import 'dotenv/config';
import { prisma } from '../lib/prisma';
import { buyStockForUser, sellStockForUser } from '../lib/actions/transaction.actions';

const SYMBOL = 'AAPL';
const COMPANY = 'Apple Inc.';
const CONCURRENT_BUYS = 10;
const BUY_QUANTITY = 5;
const INITIAL_BALANCE = 1_000_000;

let failures = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    failures++;
    console.error(`FAIL: ${message}`);
  } else {
    console.log(`PASS: ${message}`);
  }
}

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set.');
    process.exit(1);
  }
  if (!process.env.FINNHUB_API_KEY) {
    console.error('FINNHUB_API_KEY is not set (buyStockForUser/sellStockForUser fetch a live quote).');
    process.exit(1);
  }

  const testUser = await prisma.user.create({
    data: {
      email: `concurrency-test-${Date.now()}@example.invalid`,
      name: 'Concurrency Test User',
      cashBalance: INITIAL_BALANCE,
      emailVerified: true,
    },
  });

  console.log(`Created test user ${testUser.id} with $${INITIAL_BALANCE} cash`);

  try {
    // --- Phase 1: concurrent buys ---
    console.log(`\nFiring ${CONCURRENT_BUYS} concurrent buys of ${BUY_QUANTITY} ${SYMBOL} each...`);
    const buyResults = await Promise.all(
      Array.from({ length: CONCURRENT_BUYS }, () =>
        buyStockForUser(testUser.id, { symbol: SYMBOL, company: COMPANY, quantity: BUY_QUANTITY })
      )
    );

    const successfulBuys = buyResults.filter((r) => r.success);
    assert(successfulBuys.length === CONCURRENT_BUYS, `all ${CONCURRENT_BUYS} concurrent buys succeeded (got ${successfulBuys.length})`);
    buyResults.filter((r) => !r.success).forEach((r) => console.error('  buy failure:', r.error));

    const transactionsAfterBuy = await prisma.transaction.findMany({ where: { userId: testUser.id, type: 'BUY' } });
    const totalSpent = transactionsAfterBuy.reduce((sum, t) => sum + t.totalAmount.toNumber(), 0);
    const expectedQuantity = transactionsAfterBuy.reduce((sum, t) => sum + t.quantity, 0);

    const userAfterBuy = await prisma.user.findUniqueOrThrow({ where: { id: testUser.id } });
    const holdingAfterBuy = await prisma.portfolioHolding.findUnique({
      where: { userId_symbol: { userId: testUser.id, symbol: SYMBOL } },
    });

    assert(
      Math.abs(userAfterBuy.cashBalance.toNumber() - (INITIAL_BALANCE - totalSpent)) < 0.01,
      `cashBalance ($${userAfterBuy.cashBalance.toFixed(2)}) exactly reflects sum of recorded buy transactions ($${(INITIAL_BALANCE - totalSpent).toFixed(2)}) — no lost updates`
    );
    assert(!!holdingAfterBuy, 'a PortfolioHolding row exists after buying');
    assert(
      holdingAfterBuy?.quantity === expectedQuantity,
      `holding quantity (${holdingAfterBuy?.quantity}) matches sum of buy quantities (${expectedQuantity})`
    );
    assert(
      Math.abs((holdingAfterBuy?.totalCost.toNumber() ?? 0) - totalSpent) < 0.01,
      `holding totalCost ($${holdingAfterBuy?.totalCost.toFixed(2)}) matches sum of buy totalAmounts ($${totalSpent.toFixed(2)})`
    );

    // --- Phase 2: concurrent sells that overshoot available shares ---
    // Each sell request tries to sell all owned shares. Only one should be able to
    // succeed under Serializable isolation; the rest must see the already-reduced
    // holding and fail cleanly rather than driving quantity negative.
    const ownedQuantity = holdingAfterBuy?.quantity ?? 0;
    const oversellAttempts = 5;
    console.log(`\nFiring ${oversellAttempts} concurrent sells that each try to sell all ${ownedQuantity} shares...`);

    const sellResults = await Promise.all(
      Array.from({ length: oversellAttempts }, () =>
        sellStockForUser(testUser.id, { symbol: SYMBOL, company: COMPANY, quantity: ownedQuantity })
      )
    );

    const successfulSells = sellResults.filter((r) => r.success);
    assert(successfulSells.length === 1, `exactly one of ${oversellAttempts} overlapping full-sell attempts succeeded (got ${successfulSells.length})`);

    const holdingAfterSell = await prisma.portfolioHolding.findUnique({
      where: { userId_symbol: { userId: testUser.id, symbol: SYMBOL } },
    });
    assert(!holdingAfterSell, 'holding is fully liquidated (row deleted) after selling all shares — no negative quantity possible');

    const userAfterSell = await prisma.user.findUniqueOrThrow({ where: { id: testUser.id } });
    const sellTransaction = await prisma.transaction.findFirst({ where: { userId: testUser.id, type: 'SELL' } });
    const expectedBalanceAfterSell = userAfterBuy.cashBalance.toNumber() + (sellTransaction?.totalAmount.toNumber() ?? 0);
    assert(
      Math.abs(userAfterSell.cashBalance.toNumber() - expectedBalanceAfterSell) < 0.01,
      `cashBalance after sell ($${userAfterSell.cashBalance.toFixed(2)}) exactly reflects the one successful sell ($${expectedBalanceAfterSell.toFixed(2)})`
    );
  } finally {
    await prisma.user.delete({ where: { id: testUser.id } }); // cascades to Transaction/PortfolioHolding
    console.log(`\nCleaned up test user ${testUser.id}`);
  }

  console.log(`\n${failures === 0 ? 'ALL CHECKS PASSED' : `${failures} CHECK(S) FAILED`}`);
  await prisma.$disconnect();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch(async (err) => {
  console.error('Concurrency test crashed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
