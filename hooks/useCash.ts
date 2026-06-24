import { useState, useEffect, useCallback } from 'react';
import { CashShift, CashMovement, FinancialAccount } from '@/lib/supabase';
import { LS_KEYS, getAll, insert, update, remove, generateId, addAuditLog } from '@/lib/local-db';
import { useAuth } from '@/contexts/AuthContext';

export function useCashShifts() {
  const [currentShift, setCurrentShift] = useState<CashShift | null>(null);
  const [shifts, setShifts] = useState<CashShift[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchCurrentShift = useCallback(() => {
    const data = getAll<CashShift>(LS_KEYS.CASH_SHIFTS);
    const open = data
      .filter((s) => s.status === 'aberto')
      .sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime())[0];
    setCurrentShift(open || null);
    setLoading(false);
  }, []);

  const fetchShifts = useCallback((limit?: number) => {
    let data = getAll<CashShift>(LS_KEYS.CASH_SHIFTS);
    const users = getAll(LS_KEYS.REGISTERED_USERS);

    data = data.map((s) => ({
      ...s,
      user: (users.find((u: any) => u.id === s.user_id) as CashShift['user']) || undefined,
    }));
    data.sort((a, b) => new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime());

    if (limit) {
      data = data.slice(0, limit);
    }

    setShifts(data);
  }, []);

  useEffect(() => {
    fetchCurrentShift();
  }, [fetchCurrentShift]);

  const openShift = (openingBalance: number) => {
    const now = new Date().toISOString();
    const newShift = insert<CashShift>(LS_KEYS.CASH_SHIFTS, {
      id: generateId(),
      user_id: user?.id || null,
      opening_balance: openingBalance,
      closing_balance: null,
      status: 'aberto',
      opened_at: now,
      closed_at: null,
      notes: null,
      user: null,
      created_at: now,
      updated_at: now,
    } as any);

    addAuditLog('open_shift', 'cash_shifts', newShift.id, null, newShift);
    setCurrentShift(newShift);
    return newShift;
  };

  const closeShift = (closingBalance: number, notes?: string) => {
    if (!currentShift) throw new Error('No open shift');

    const updated = update<CashShift>(LS_KEYS.CASH_SHIFTS, currentShift.id, {
      closing_balance: closingBalance,
      status: 'fechado',
      closed_at: new Date().toISOString(),
      notes,
    });

    if (!updated) throw new Error('Failed to close shift');
    addAuditLog('close_shift', 'cash_shifts', currentShift.id, null, updated);
    setCurrentShift(null);
  };

  return {
    currentShift,
    shifts,
    loading,
    fetchShifts,
    fetchCurrentShift,
    openShift,
    closeShift,
  };
}

export function useCashMovements(shiftId?: string) {
  const [movements, setMovements] = useState<CashMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchMovements = useCallback((cashShiftId?: string) => {
    setLoading(true);
    let data = getAll<CashMovement>(LS_KEYS.CASH_MOVEMENTS);
    const users = getAll(LS_KEYS.REGISTERED_USERS);

    if (cashShiftId) {
      data = data.filter((m) => m.cash_shift_id === cashShiftId);
    }

    data = data.map((m) => ({
      ...m,
      user: (users.find((u: any) => u.id === m.user_id) as CashMovement['user']) || undefined,
    }));
    data.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setMovements(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMovements(shiftId);
  }, [fetchMovements, shiftId]);

  const addMovement = (
    cashShiftId: string,
    type: 'entrada' | 'saida',
    amount: number,
    reason?: string
  ) => {
    const now = new Date().toISOString();
    const newMovement = insert<CashMovement>(LS_KEYS.CASH_MOVEMENTS, {
      id: generateId(),
      cash_shift_id: cashShiftId,
      type,
      amount,
      reason,
      user_id: user?.id || null,
      created_at: now,
    } as any);

    addAuditLog('cash_movement', 'cash_movements', newMovement.id, null, newMovement);
    setMovements((prev) => [newMovement, ...prev]);
    return newMovement;
  };

  const sangria = (cashShiftId: string, amount: number, reason?: string) => {
    return addMovement(cashShiftId, 'saida', amount, reason || 'Sangria');
  };

  const suprimento = (cashShiftId: string, amount: number, reason?: string) => {
    return addMovement(cashShiftId, 'entrada', amount, reason || 'Suprimento');
  };

  return {
    movements,
    loading,
    fetchMovements,
    addMovement,
    sangria,
    suprimento,
  };
}

export function useFinancial() {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchAccounts = useCallback((type?: 'pagar' | 'receber', status?: string) => {
    setLoading(true);
    let data = getAll<FinancialAccount>(LS_KEYS.FINANCIAL_ACCOUNTS);

    if (type) {
      data = data.filter((a) => a.type === type);
    }
    if (status) {
      data = data.filter((a) => a.status === status);
    }

    data.sort((a, b) => {
      const aDate = a.due_date || '';
      const bDate = b.due_date || '';
      return aDate.localeCompare(bDate);
    });

    setAccounts(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const createAccount = (account: Partial<FinancialAccount>) => {
    const newAccount = insert<FinancialAccount>(LS_KEYS.FINANCIAL_ACCOUNTS, {
      ...account,
      user_id: user?.id || null,
    } as any);

    addAuditLog('create_account', 'financial_accounts', newAccount.id, null, newAccount);
    setAccounts((prev) => [...prev, newAccount]);
    return newAccount;
  };

  const updateAccount = (id: string, updates: Partial<FinancialAccount>) => {
    const updated = update<FinancialAccount>(LS_KEYS.FINANCIAL_ACCOUNTS, id, updates);
    if (!updated) throw new Error('Account not found');
    addAuditLog('update_account', 'financial_accounts', id, null, updated);
    setAccounts((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  };

  const deleteAccount = (id: string) => {
    const removed = remove<FinancialAccount>(LS_KEYS.FINANCIAL_ACCOUNTS, id);
    if (!removed) throw new Error('Account not found');
    addAuditLog('delete_account', 'financial_accounts', id, null, null);
    setAccounts((prev) => prev.filter((a) => a.id !== id));
  };

  const markAsPaid = (id: string) => {
    return updateAccount(id, {
      status: 'pago',
      payment_date: new Date().toISOString().split('T')[0],
    });
  };

  const getTotalToPay = () => {
    return accounts
      .filter((a) => a.type === 'pagar' && a.status === 'pendente')
      .reduce((sum, a) => sum + a.amount, 0);
  };

  const getTotalToReceive = () => {
    return accounts
      .filter((a) => a.type === 'receber' && a.status === 'pendente')
      .reduce((sum, a) => sum + a.amount, 0);
  };

  return {
    accounts,
    loading,
    fetchAccounts,
    createAccount,
    updateAccount,
    deleteAccount,
    markAsPaid,
    getTotalToPay,
    getTotalToReceive,
  };
}
