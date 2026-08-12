import API from "../..";

export const PaymentsService = async () => {
    return API.get("/payments/balance")
}

export const PaymentCardsService = async () => {
    return API.get("/payments/payment-methods")
}

export const TransactionsHistoryService = async (year, month) => {
    return API.get(`/payments/transactions/v1/?year=${year}&month=${month}`)
}

export const TransactionsHistoryDownloadService = async (year, month) => {
    return API.get(`/payments/transactions/v1/?download=1&year=${year}&month=${month}`)
}

export const SaveCardsService = async (data) => {
    return API.post("/payments/save-card-details", data)
}

export const SavePayoutService = async (data) => {
    return API.post("/payments/payout-method", data)
}

export const editPayoutService = async (data) => {
    return API.put("/payments/payout-method", data)
}

export const deletePayoutService = async (id) => {
    return API.delete(`/payments/payout-method/${id}`)
}


export const checkPayoutService = async () => {
    return API.get("/payments/payout-method/check");
}