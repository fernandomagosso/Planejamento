import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { InsightResult } from "../types";
import { Loader } from "./Loader";

interface FinancialInsightsProps {
    onFetchInsights: (topic: string) => void;
    isLoading: boolean;
    error: string | null;
    insights: InsightResult | null;
}

const topics = ["Investing Basics", "Debt Management", "Retirement Planning", "Market News"];

export const FinancialInsights = ({ onFetchInsights, isLoading, error, insights }: FinancialInsightsProps) => {
    return (
        _jsxs("section", { className: "insights-container", children: [
            _jsx("h2", { children: "Financial Insights" }),
            _jsx("p", { children: "Explore financial topics to enhance your knowledge." }),
            _jsx("div", { className: "topic-buttons", children: 
                topics.map(topic => (
                    _jsx("button", { 
                        onClick: () => onFetchInsights(topic), 
                        className: "btn btn-secondary",
                        disabled: isLoading,
                        children: topic
                    }, topic)
                ))
            }),
            isLoading && _jsx(Loader, {}),
            error && _jsx("div", { role: "alert", className: "error-message", children: `Error: ${error}` }),
            !isLoading && insights && (
                _jsxs("div", { className: "insights-content", children: [
                    _jsx("p", { children: insights.text }),
                    insights.sources && insights.sources.length > 0 && (
                        _jsxs(_Fragment, { children: [
                            _jsx("h4", { children: "Sources" }),
                            _jsx("ul", { className: "sources-list", children: 
                                // Fix: Filter out sources without a URI to prevent rendering invalid links.
                                insights.sources.filter(source => source.web?.uri).map((source, index) => 
                                    _jsx("li", { children: 
                                        _jsx("a", { href: source.web.uri, target: "_blank", rel: "noopener noreferrer", children: source.web.title || source.web.uri })
                                    }, `source-${index}`)
                                )
                            })
                        ] })
                    )
                ] })
            )
        ]})
    );
};
