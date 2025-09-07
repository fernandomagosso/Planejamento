// Fix: Creating a loader component for indicating loading states.
import { jsx as _jsx } from "react/jsx-runtime";

export const Loader = () => {
  return (
    _jsx("div", { className: "loader-container", "aria-label": "Loading...", role: "status", children:
      _jsx("div", { className: "loader" })
    })
  );
};
