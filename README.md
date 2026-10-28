# Minira Jewels catalogue

Mobile-first static storefront with 438 products, burgundy/gold/cream branding, saved and shareable carts, and WhatsApp checkout to +91 7202811287. No dependencies, login or online payment.

## Run locally

From this folder, run `python3 -m http.server 8080`, then open http://localhost:8080. Use an HTTP server rather than opening index.html directly, because the catalogue is loaded from products.json.

## Product images

Place the original product files in `images/products/`, preserving their exact filenames, extensions and bytes. Product cards resolve `products.json`'s `image` field, URL-encode filenames, lazy-load images and use `object-fit: contain`. No source-image transformations are performed.

All 438 original images are included in `images/products/` and matched to the live product sheet. Every copy was verified against its Drive-reported byte size and its saved SHA-256 digest. `image-manifest.json` records filenames, sizes and digests. Formats: 436 PNG files and two JPG files (AT - N100.jpg and AT - E013.jpg). Source folder: https://drive.google.com/drive/folders/1Sz-uPx_4klwTXlfcqsAdFe7cUIIwn5lC.

## Business rules

- Ring eligibility is determined by SKU prefix `AT - R`, including rings in special collections. Legacy `ringOffer` flags are informational and do not determine eligibility.
- Eligible ring units are sorted by ascending price and grouped into complete groups of five. The first two units of each group are free; incomplete groups receive no discount. Five/ten/fifteen units give two/four/six free units.
- Merchandise payable is subtotal minus ring discount. Shipping is ₹79 when merchandise is positive and below ₹999, otherwise ₹0.
- Out-of-stock pieces stay visible but cannot be added. Saved/shared carts are checked against current products and stock; unknown products and invalid quantities are removed with a notice.
- Shared links contain SKU/quantity data, never trusted prices. Totals are recalculated from the current catalogue. Very large carts are subject to browser and messaging-app URL limits.
- WhatsApp checkout prepares an order message; the customer sends it in WhatsApp. No messages are sent automatically.

## Inventory and verification

`products.json` is a fresh snapshot read from the Minira Website - Products sheet, not a live Google Sheets connection. Update stock/prices in this file to update the storefront. Product names remain blank where unavailable; codes serve as identifiers.

Run `node pricing.test.js` for catalogue and business-rule regression checks. Run `node --check app.js` and `node --check pricing.js` for syntax checks.

This repository holds source code. Adding code does not deploy a public website.

## Optimized website images

The storefront uses separate 400px and 640px WebP copies for all 438 products, selected through responsive srcset/sizes. Original files and product filenames remain unchanged. The logo also has a smaller website copy. Generated files include content hashes and are cached for one year; regenerated artwork receives a different URL. HTML, inventory and scripts retain normal revalidation.

To regenerate, install Pillow in your development environment and run `python3 scripts/optimize-images.py`. It preserves image proportions, transparency and embedded ICC profiles. Outputs: images/optimized/, image-assets.js and optimized-images.json. Update the logo path in index.html if its content changes.
