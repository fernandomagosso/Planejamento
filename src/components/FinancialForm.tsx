// Fix: Implementing the financial form component to collect user data.
import { useState, FormEvent } from "react";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { FinancialData } from "../types";

interface FinancialFormProps {
  onSubmit: (data: FinancialData) => void;
  isLoading: boolean;
}

const initialFormData: FinancialData = {
  income: 5000,
  expenses: 3000,
  investments: 10000,
  debt: 5000,
  savingsGoal: 20000,
};

export const FinancialForm = ({ onSubmit, isLoading }: FinancialFormProps) => {
  const [formData, setFormData] = useState<FinancialData>(initialFormData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: Number(value) >= 0 ? Number(value) : 0,
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    _jsx("div", { className: "form-container", children:
      _jsxs("form", { onSubmit: handleSubmit, className: "financial-form", children: [
        _jsx("h2", { children: "Your Financial Snapshot" }),
        _jsxs("div", { className: "form-group", children: [
          _jsx("label", { htmlFor: "income", children: "Monthly Income ($)" }),
          _jsx("input", { type: "number", id: "income", name: "income", value: formData.income, onChange: handleChange, required: true, min: 0 })
        ] }),
        _jsxs("div", { className: "form-group", children: [
          _jsx("label", { htmlFor: "expenses", children: "Monthly Expenses ($)" }),
          _jsx("input", { type: "number", id: "expenses", name: "expenses", value: formData.expenses, onChange: handleChange, required: true, min: 0 })
        ] }),
        _jsxs("div", { className: "form-group", children: [
          _jsx("label", { htmlFor: "investments", children: "Total Investments ($)" }),
          _jsx("input", { type: "number", id: "investments", name: "investments", value: formData.investments, onChange: handleChange, required: true, min: 0 })
        ] }),
        _jsxs("div", { className: "form-group", children: [
          _jsx("label", { htmlFor: "debt", children: "Total Debt ($)" }),
          _jsx("input", { type: "number", id: "debt", name: "debt", value: formData.debt, onChange: handleChange, required: true, min: 0 })
        ] }),
        _jsxs("div", { className: "form-group", children: [
          _jsx("label", { htmlFor: "savingsGoal", children: "Savings Goal ($)" }),
          _jsx("input", { type: "number", id: "savingsGoal", name: "savingsGoal", value: formData.savingsGoal, onChange: handleChange, required: true, min: 0 })
        ] }),
        _jsx("button", { type: "submit", className: "btn btn-primary", disabled: isLoading, children: isLoading ? "Analyzing..." : "Get Analysis" })
      ] })
    })
  );
};
