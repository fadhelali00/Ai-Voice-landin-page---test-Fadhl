// Shared SVG sprite for the checkout-journey mockups.
// Icons are traced from v65 shapes (see ../screens/*.html); no brand assets, no payment-network logos.
// Colours come from currentColor or var(--jarna-*) only.
(function () {
  var s = '' +
  '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' +
  '<symbol id="sar" viewBox="0 0 20 22"><path d="M6.5 2v15l3-1.2M12.5 3.5V20M2.2 10.6 17.8 7.2M2.2 16.2l15.6-3.4"/></symbol>' +
  '<symbol id="i-back" viewBox="0 0 24 24"><path d="M3 12h18M14 5l7 7-7 7"/></symbol>' +
  '<symbol id="i-trash" viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/></symbol>' +
  '<symbol id="i-plus" viewBox="0 0 24 24"><path d="M12 4v16M4 12h16"/></symbol>' +
  '<symbol id="i-minus" viewBox="0 0 24 24"><path d="M4 12h16"/></symbol>' +
  '<symbol id="i-plus-c" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5"/><path d="M12 7.5v9M7.5 12h9"/></symbol>' +
  '<symbol id="i-truck" viewBox="0 0 24 24"><path d="M1.5 5.5h12.5v10H1.5zM14.8 8.5h4.2l3.5 3.8v3.2h-7.7z"/><circle cx="6" cy="17.5" r="2.4" stroke="var(--jarna-white)" stroke-width="1.3"/><circle cx="18" cy="17.5" r="2.4" stroke="var(--jarna-white)" stroke-width="1.3"/></symbol>' +
  '<symbol id="i-chev-l" viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></symbol>' +
  '<symbol id="i-chev-r" viewBox="0 0 24 24"><path d="M9 5l7 7-7 7"/></symbol>' +
  '<symbol id="i-chev-u" viewBox="0 0 24 24"><path d="M5 15l7-7 7 7"/></symbol>' +
  '<symbol id="i-chev-d" viewBox="0 0 24 24"><path d="M5 9l7 7 7-7"/></symbol>' +
  '<symbol id="i-note" viewBox="0 0 24 24"><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3h13A1.5 1.5 0 0 1 20 4.5V14l-7 7H5.5A1.5 1.5 0 0 1 4 19.5zM13 21v-5.5a1.5 1.5 0 0 1 1.5-1.5H20"/></symbol>' +
  '<symbol id="i-receipt" viewBox="0 0 24 24"><path d="M5 2.5h14v19l-2.3-1.6-2.3 1.6-2.4-1.6-2.3 1.6-2.4-1.6L5 21.5zM8.5 7.5h7M8.5 11h7M8.5 14.5h4"/></symbol>' +
  '<symbol id="i-scooter" viewBox="0 0 24 24"><circle cx="5.5" cy="17" r="2.5"/><circle cx="18.5" cy="17" r="2.5"/><path d="M8 17h8M15 6h2.5l1 8.5M4 11.5h6l2 5.5M7 8.5h4"/></symbol>' +
  '<symbol id="i-pin" viewBox="0 0 24 28"><path d="M12 1.5a10 10 0 0 0-10 10c0 7 10 15 10 15s10-8 10-15a10 10 0 0 0-10-10z" fill="currentColor" stroke="none"/><circle cx="12" cy="11.5" r="3.6" fill="var(--jarna-white)" stroke="none"/></symbol>' +
  '<symbol id="i-bm" viewBox="0 0 24 24"><path d="M6 3h12v18l-6-4.5L6 21z"/></symbol>' +
  '<symbol id="i-check" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></symbol>' +
  '<symbol id="i-check-c" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M7.5 12.3l3 3 6-6.3"/></symbol>' +
  '<symbol id="i-close" viewBox="0 0 24 24"><path d="M4 4l16 16M20 4L4 20"/></symbol>' +
  '<symbol id="i-search" viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="7"/><path d="m15.8 15.8 5.2 5.2"/></symbol>' +
  '<symbol id="i-filter" viewBox="0 0 24 24"><path d="M3 6h11M18 6h3M3 12h4M11 12h10M3 18h13M20 18h1"/><circle cx="16" cy="6" r="2"/><circle cx="9" cy="12" r="2"/><circle cx="18" cy="18" r="2"/></symbol>' +
  '<symbol id="i-sort" viewBox="0 0 24 24"><path d="M7 4v16M3.5 7.5 7 4l3.5 3.5M17 20V4M13.5 16.5 17 20l3.5-3.5"/></symbol>' +
  '<symbol id="i-bolt" viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7z" fill="currentColor" stroke="none"/></symbol>' +
  '<symbol id="i-clock" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9.5"/><path d="M12 7v5.2l3.4 2"/></symbol>' +
  '<symbol id="i-door" viewBox="0 0 24 24"><path d="M5 21V4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v17M3 21h18"/><circle cx="15" cy="12.5" r="1" fill="currentColor"/></symbol>' +
  '<symbol id="i-bell-off" viewBox="0 0 24 24"><path d="M6 17V11a6 6 0 0 1 9.5-4.9M18 11v6l1.5 1.5H8M10 21h4M3 3l18 18"/></symbol>' +
  '<symbol id="i-basket-x" viewBox="0 0 24 24"><path d="M3 9h18l-2 11H5zM8 9l3-6M16 9l-3-6M9.5 13l5 4M14.5 13l-5 4"/></symbol>' +
  '<symbol id="i-card" viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 9.5h19M6 15h4"/></symbol>' +
  '<symbol id="i-phone" viewBox="0 0 24 24"><rect x="6" y="2.5" width="12" height="19" rx="2.5"/><path d="M10.5 18.5h3"/></symbol>' +
  '<symbol id="i-cash" viewBox="0 0 24 24"><rect x="2.5" y="6" width="19" height="12" rx="2"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/></symbol>' +
  '<symbol id="i-lock" viewBox="0 0 24 24"><rect x="4.5" y="10.5" width="15" height="10.5" rx="2"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></symbol>' +
  '<symbol id="i-tag" viewBox="0 0 24 24"><path d="M3 12V4a1 1 0 0 1 1-1h8l9 9-9 9z"/><circle cx="7.5" cy="7.5" r="1.5"/></symbol>' +
  '<symbol id="i-coupon" viewBox="0 0 24 24"><polygon points="12.00,1.00 15.03,2.68 18.47,3.10 19.93,6.24 22.46,8.60 21.80,12.00 22.46,15.40 19.93,17.76 18.47,20.90 15.03,21.32 12.00,23.00 8.97,21.32 5.53,20.90 4.07,17.76 1.54,15.40 2.20,12.00 1.54,8.60 4.07,6.24 5.53,3.10 8.97,2.68" fill="var(--jarna-offer-icon)" stroke="var(--jarna-offer-icon)" stroke-width="1.6" stroke-linejoin="round"/><circle cx="9" cy="9.2" r="1.7" fill="var(--jarna-on-offer-icon)"/><circle cx="15" cy="14.8" r="1.7" fill="var(--jarna-on-offer-icon)"/><path d="M15.6 8.2l-7.2 7.6" stroke="var(--jarna-on-offer-icon)" stroke-width="1.9" stroke-linecap="round"/></symbol>' +
  '</svg>';
  document.body.insertAdjacentHTML('afterbegin', s);
})();
