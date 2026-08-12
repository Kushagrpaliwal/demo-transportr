/**
 * Parse /fee/insurance_fee response:
 * { success, data: { amount: "0.15", percentage: "1.20", hide: 0, ... } }
 */
export const parseInsuranceFeeConfig = (response) => {
  const data = response?.data ?? response ?? {};

  return {
    percentage: parseFloat(data.percentage) || 0,
    amount: parseFloat(data.amount) || 0,
    hide: data.hide,
  };
};

/** percentage "1.20" => 1.2% => rate 0.012 */
export const getInsuranceFeeRate = (percentage) => {
  const pct = parseFloat(percentage) || 0;
  if (pct === 0) return 0;
  if (pct > 0 && pct < 1) return pct;
  return pct / 100;
};

/** insurance fee = (percentage% of insurance_premium) + amount */
export const calcInsuranceFee = (insurancePremium, insuranceFee) => {
  const premium = parseFloat(insurancePremium) || 0;
  const percentage = parseFloat(insuranceFee?.percentage) || 0;
  const amount = parseFloat(insuranceFee?.amount) || 0;
  const rate = getInsuranceFeeRate(percentage);
  const percentagePart = premium * rate;
  const total = percentagePart + amount;

  return { premium, percentage, rate, percentagePart, amount, total };
};
