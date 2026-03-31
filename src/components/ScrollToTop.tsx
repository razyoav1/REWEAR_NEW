import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    // Reset inner page scroll
    const el = document.querySelector(".page-content");
    if (el) el.scrollTop = 0;
    // Reset window/body scroll — mobile Safari pushes these when keyboard opens
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [pathname]);
  return null;
}
