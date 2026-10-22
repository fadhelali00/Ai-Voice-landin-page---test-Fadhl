# Next (after launch): in-app popup ad on app open

- **Classification:** Next. Deferred by Fadhl (2026-10-22) until after launch.
- **Finding:** The platform has no popup feature. Admin offers banners (top/carousel), offers, promo codes, push notifications and paid ads campaigns.
- **Proposal:**
  - **Backend (Mohammed):** a new banner type "popup" with start/end dates and a per-customer frequency cap.
  - **Flutter (Obeid):** on app open, show the active popup with a close button and a CTA that opens the banner's target.
