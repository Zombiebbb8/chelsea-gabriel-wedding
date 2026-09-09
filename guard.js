// Runs first, before any other script, on Attire/Travel/Gifts.
// If this device hasn't passed the invitation gate yet, send it to the
// homepage's envelope ceremony first, then bounce back to what it wanted.
// If it HAS, hide the gate/envelope markup (kept in every page's body only
// so main.js's unconditional DOM references, e.g. env-canvas, stay safe)
// before the browser ever paints it — a <style> rule injected from <head>
// applies before body content renders, so there is no flash.
(function(){
  var unlocked = false;
  try {
    unlocked = localStorage.getItem('wdg_v1_opened') === '1' || localStorage.getItem('wdg_v1_unlocked') === '1';
  } catch (e) {}

  // A guest arriving on their own private link has already proved who they
  // are — never bounce them to a password gate. Remember it so the rest of
  // their visit, and later visits, flow straight through.
  try {
    if (!unlocked && new URLSearchParams(location.search).get('guest')) {
      localStorage.setItem('wdg_v1_unlocked', '1');
      unlocked = true;
    }
  } catch (e) {}

  if (!unlocked) {
    location.replace('/?next=' + encodeURIComponent(location.pathname + location.search));
    return;
  }
  document.write('<style>#gate,#intro{display:none!important}</style>');
})();
