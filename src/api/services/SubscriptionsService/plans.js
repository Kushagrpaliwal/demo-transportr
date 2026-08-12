import API from "../..";

export const PlansService = async () => {
    return API.get("/subscription/plans");
};

export const PlanStatusService = async () => {
    return API.get("/subscription/status");
};

export const SubscriptionPaymentSessionService = async (planId) => {
    return API.post("/subscription/payment", {
        plan: planId,
    });
};

export const SubscriptionDowngradeService = async () => {
    return API.post("/subscription/downgrade");
};

export const SubscriptionSwitchPlanService = async (planId) => {
    return API.post("/subscription/switch-plan", {
        plan: planId,
    });
};