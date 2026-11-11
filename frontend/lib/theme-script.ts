/**
 * Runs before first paint (inline in <head>) so there is no light/dark flash.
 * Storage key "theme": "dark" = dark mode; anything else = light (the default).
 */
export const THEME_INIT_SCRIPT = `(function(){try{document.documentElement.classList.toggle('dark',localStorage.getItem('theme')==='dark');}catch(e){}})();`;
