import {
  PUBLIC_SKIP_HREF,
  PUBLIC_SKIP_LABEL,
} from "@/lib/site-design/public-keyboard";

/**
 * Keyboard-first skip link for public SiteTheme surfaces.
 * Visually hidden until focused; styled in globals.css (.skip-to-content).
 */
export function SkipToContent() {
  return (
    <a
      href={PUBLIC_SKIP_HREF}
      className="skip-to-content"
      data-public-skip-to-content=""
    >
      {PUBLIC_SKIP_LABEL}
    </a>
  );
}
