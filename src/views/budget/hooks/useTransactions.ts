import { useState, useEffect } from "react";
import { useApi } from "@/hooks/useApi";
import { useTransactionToast } from "@/hooks/useTransactionToast";
import { Transaction, CreateTransactionDto, UpdateTransactionDto } from "@/types/transaction/transaction";

export const useTransactions = (userId: number) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const api = useApi(userId);
    const transactionToast = useTransactionToast();

    // Fetch transactions
    useEffect(() => {
        const fetchTransactions = async () => {
            if (!api.transactions || !userId) return;

            try {
                const response = await api.transactions.getAll();
                if (response.data) {
                    setTransactions(response.data);
                }
            } catch (err) {
                setError("Échec du chargement des transactions");
                console.error("Erreur lors du chargement des transactions:", err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTransactions();
    }, [api.transactions, userId]);

    // CRUD operations
    const handleCreate = async (data: CreateTransactionDto): Promise<Transaction | false> => {
        if (!api.transactions || !userId) return false;

        try {
            const toastId = transactionToast.createLoadingToast({
                type: data.type,
                description: data.description,
            });

            const response = await api.transactions.create(data);
            if (response.data) {
                const newTransaction = response.data;
                setTransactions((prev) => [...prev, newTransaction]);

                transactionToast.createToast(toastId, {
                    type: newTransaction.type,
                    description: newTransaction.description,
                });

                return newTransaction;
            }
            throw new Error("Échec de la création");
        } catch (err) {
            console.error("Erreur lors de la création:", err);
            transactionToast.errorToast("", err, {
                errorMessage: "Échec de la création",
                description: data.description,
            });
            return false;
        }
    };


    const handleUpdate = async (transactionId: number, transaction: UpdateTransactionDto): Promise<Transaction | false> => {
        if (!api.transactions || !userId) return false;

        try {
            const toastId = transactionToast.updateLoadingToast({
                type: transaction.type,
                description: transaction.description,
            });

            const response = await api.transactions.updateById(transactionId, transaction);
            if (!response.data) {
                throw new Error("Échec de la mise à jour");
            }
            const updatedTransaction = response.data;

            setTransactions((prev) => prev.map((t) => (t.id === transactionId ? updatedTransaction : t)));

            transactionToast.updateToast(toastId, {
                type: updatedTransaction.type,
                description: updatedTransaction.description,
            });

            return response.data;
        } catch (err) {
            console.error("Erreur lors de la mise à jour:", err);
            transactionToast.errorToast("", err, {
                errorMessage: "Échec de la mise à jour",
                description: transaction.description,
            });
            return false;
        }
    };

    const handleDelete = async (transaction: Transaction): Promise<boolean> => {
        if (!api.transactions || !userId) return false;

        try {
            const toastId = transactionToast.deleteLoadingToast({
                type: transaction.type,
                description: transaction.description,
            });

            await api.transactions.deleteById(transaction.id);
            setTransactions((prev) => prev.filter((t) => t.id !== transaction.id));

            transactionToast.deleteToast(toastId, {
                type: transaction.type,
                description: transaction.description,
            });

            return true;
        } catch (err) {
            console.error("Erreur lors de la suppression:", err);
            transactionToast.errorToast("", err, {
                errorMessage: "Échec de la suppression",
                description: transaction.description,
            });
            return false;
        }
    };

    return {
        transactions,
        isLoading,
        error,
        handleCreate,
        handleUpdate,
        handleDelete,
    };
}; 