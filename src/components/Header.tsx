import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";

interface UserProfile {
    name: string;
    email: string;
    picture: string;
}

interface HeaderProps {
    user: UserProfile | null;
    onLogin: () => void;
    onLogout: () => void;
    isAuthReady: boolean;
    isAuthLoading: boolean;
}

export const Header = ({ user, onLogin, onLogout, isAuthReady, isAuthLoading }: HeaderProps) => {
    return (
        _jsxs("header", { className: "app-header", children: [
            _jsx("h1", { className: "app-title", children: "FinanZen" }),
            _jsx("div", { className: "auth-section", children:
                user ? (
                    _jsxs("div", { className: "user-profile", children: [
                        _jsx("img", { src: user.picture, alt: "User profile", className: "user-avatar" }),
                        _jsx("span", { className: "user-name", children: user.name }),
                        _jsx("button", { onClick: onLogout, className: "btn btn-secondary", children: "Logout" })
                    ] })
                ) : (
                    _jsxs("button", {
                        onClick: onLogin,
                        className: "btn btn-primary",
                        disabled: !isAuthReady || isAuthLoading,
                        children: [
                            _jsx("svg", { "aria-hidden": "true", focusable: "false", width: "18", height: "18", viewBox: "0 0 18 18", children:
                                _jsxs("g", { fill: "none", fillRule: "evenodd", children: [
                                    _jsx("path", { fill: "#4285F4", d: "M17.64 9.2045c0-.6382-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2082 1.125-.8427 2.0782-1.7963 2.7218v2.2582h2.9082c1.7018-1.5664 2.6836-3.8736 2.6836-6.621" }),
                                    _jsx("path", { fill: "#34A853", d: "M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9082-2.2582c-.8059.54-1.8368.859-3.0482.859-2.344 0-4.3282-1.5832-5.036-3.7104H.9573v2.3318C2.4382 15.9832 5.4818 18 9 18" }),
                                    _jsx("path", { fill: "#FBBC05", d: "M3.964 10.71c-.18-.54-.2823-1.1168-.2823-1.71s.1023-1.17.2823-1.71V4.9582H.9573C.3477 6.1732 0 7.5477 0 9s.3477 2.8268.9573 4.0418L3.964 10.71z" }),
                                    _jsx("path", { fill: "#EA4335", d: "M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.425 0 9 0 5.4818 0 2.4382 2.0168.9573 4.9582L3.964 7.29C4.6718 5.1632 6.656 3.5795 9 3.5795" })
                                ] })
                            }),
                            isAuthLoading ? "Connecting..." : "Login with Google"
                        ]
                    })
                )
            })
        ] })
    );
};
