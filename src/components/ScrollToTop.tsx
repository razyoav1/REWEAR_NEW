import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export function ScrollToTop() {
  const { pathname } = useLocation();
  // useLayoutEffect fires before paint — resets scroll before user sees new page
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    const el = document.querySelector(".page-content");
    if (el) el.scrollTop = 0;
  }, [pathname]);
  return null;
}
