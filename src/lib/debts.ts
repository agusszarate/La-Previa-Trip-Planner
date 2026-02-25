import { Expense, ExpenseSplit, Debt, CurrencyType } from "./types";

interface MemberInfo {
  id: string;
  name: string;
}

/**
 * Calculate simplified debts from expenses.
 * Groups by currency, then uses the min-cash-flow algorithm
 * to minimize the number of transactions.
 */
export function calculateDebts(
  expenses: Expense[],
  members: MemberInfo[]
): Debt[] {
  // Group expenses by currency
  const byCurrency = new Map<CurrencyType, Expense[]>();
  for (const exp of expenses) {
    const list = byCurrency.get(exp.currency) || [];
    list.push(exp);
    byCurrency.set(exp.currency, list);
  }

  const allDebts: Debt[] = [];

  for (const [currency, currencyExpenses] of byCurrency) {
    // Calculate net balance for each member
    // Positive = is owed money, Negative = owes money
    const balances = new Map<string, number>();

    for (const member of members) {
      balances.set(member.id, 0);
    }

    for (const expense of currencyExpenses) {
      if (!expense.expense_splits) continue;

      // The payer paid the full amount, so they are owed
      const current = balances.get(expense.paid_by) || 0;
      balances.set(expense.paid_by, current + expense.amount);

      // Each person in the split owes their share
      for (const split of expense.expense_splits) {
        const bal = balances.get(split.user_id) || 0;
        balances.set(split.user_id, bal - split.amount);
      }
    }

    // Simplify debts using greedy algorithm
    const debtors: { id: string; amount: number }[] = [];
    const creditors: { id: string; amount: number }[] = [];

    for (const [id, balance] of balances) {
      if (balance < -0.01) {
        debtors.push({ id, amount: Math.abs(balance) });
      } else if (balance > 0.01) {
        creditors.push({ id, amount: balance });
      }
    }

    // Sort by amount descending for efficiency
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const transferAmount = Math.min(debtors[i].amount, creditors[j].amount);

      if (transferAmount > 0.01) {
        const fromMember = members.find((m) => m.id === debtors[i].id);
        const toMember = members.find((m) => m.id === creditors[j].id);

        allDebts.push({
          from: debtors[i].id,
          from_name: fromMember?.name || "Unknown",
          to: creditors[j].id,
          to_name: toMember?.name || "Unknown",
          amount: Math.round(transferAmount * 100) / 100,
          currency,
        });
      }

      debtors[i].amount -= transferAmount;
      creditors[j].amount -= transferAmount;

      if (debtors[i].amount < 0.01) i++;
      if (creditors[j].amount < 0.01) j++;
    }
  }

  return allDebts;
}

/**
 * Get summary stats for a trip
 */
export function getTripSummary(expenses: Expense[]) {
  const totalByCurrency = new Map<CurrencyType, number>();

  for (const exp of expenses) {
    const current = totalByCurrency.get(exp.currency) || 0;
    totalByCurrency.set(exp.currency, current + exp.amount);
  }

  const byCategory = new Map<string, number>();
  for (const exp of expenses) {
    const current = byCategory.get(exp.category) || 0;
    byCategory.set(exp.category, current + exp.amount);
  }

  return {
    totalByCurrency: Object.fromEntries(totalByCurrency),
    byCategory: Object.fromEntries(byCategory),
    count: expenses.length,
  };
}
