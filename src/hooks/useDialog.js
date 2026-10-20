import { useEffect, useLayoutEffect, useRef } from "react";
import { lockPageScroll, unlockPageScroll } from "../utils/smoothScroll";

const FOCUSABLE = 'a[href], button, input, select, textarea, [tabindex]';

// Garde le clavier et les lecteurs d'écran dans la modale ouverte.
export function useDialog(ref, onClose, initialSelector) {
  const closeRef = useRef(onClose);
  useLayoutEffect(() => { closeRef.current = onClose; }, [onClose]);

  useEffect(() => {
    const dialog = ref.current;
    const previousFocus = document.activeElement;
    const background = new Map();
    for (let branch = dialog; branch?.parentElement && branch !== document.body; branch = branch.parentElement) {
      for (const sibling of branch.parentElement.children) {
        if (sibling !== branch) {
          background.set(sibling, sibling.hasAttribute("inert"));
          sibling.setAttribute("inert", "");
        }
      }
    }
    lockPageScroll();

    function controls() {
      return [...dialog.querySelectorAll(FOCUSABLE)].filter((element) =>
        !element.disabled && element.tabIndex >= 0 && !element.closest("[inert]") && element.getClientRects().length);
    }
    function focusFirst() {
      (dialog.querySelector(initialSelector) || controls()[0] || dialog).focus({ preventScroll: true });
    }
    focusFirst();

    function onKeyDown(event) {
      if (dialog.closest("[inert]")) return;
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
      } else if (event.key === "Tab") {
        const elements = controls();
        const index = elements.indexOf(document.activeElement);
        if (elements.length === 0) {
          event.preventDefault();
          dialog.focus();
        } else if (event.shiftKey && index <= 0) {
          event.preventDefault();
          elements.at(-1).focus();
        } else if (!event.shiftKey && (index === -1 || index === elements.length - 1)) {
          event.preventDefault();
          elements[0].focus();
        }
      }
    }
    function onFocus(event) {
      if (!dialog.closest("[inert]") && !dialog.contains(event.target)) focusFirst();
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocus);
      background.forEach((inert, element) => {
        if (!inert) element.removeAttribute("inert");
      });
      unlockPageScroll();
      if (previousFocus?.isConnected) previousFocus.focus({ preventScroll: true });
    };
  }, [ref, initialSelector]);
}
