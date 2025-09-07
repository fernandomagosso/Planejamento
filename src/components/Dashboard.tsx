// Fix: Implementing the dashboard component to display analysis results.
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { AnalysisResult } from "../types";

interface DashboardProps {
  analysis: AnalysisResult | null;
}

export const Dashboard = ({ analysis }: DashboardProps) => {
  if (!analysis) {
    return null;
  }

  return (
    _jsxs("section", { className: "dashboard", "aria-labelledby": "dashboard-title", children: [
      _jsx("h2", { id: "dashboard-title", children: "Your Financial Analysis" }),
      _jsxs("div", { className: "analysis-section", children: [
        _jsx("h3", { children: "Summary" }),
        _jsx("p", { children: analysis.summary })
      ] }),
      _jsxs("div", { className: "analysis-section", children: [
        _jsx("h3", { children: "Suggestions" }),
        _jsx("ul", { children: 
          analysis.suggestions.map((suggestion, index) =>
            _jsx("li", { children: suggestion }, `suggestion-${index}`)
          )
        })
      ] })
    ] })
  );
};
