# Admin guide

To change the two homepage photos, open **Homepage → Homepage images**. **Hero image** controls the top portrait; **My Journey image** controls the second homepage portrait and the full About/Journey page. Each has an independent URL, preview, **Choose from media**, and upload input. Choose or upload PNG/JPEG/WebP files (up to 5 MB), then click **Save homepage images**. Existing portrait choices are preserved by migration 002.

Open /admin and sign in with the owner account created by `npm run owner:create`. There is no public signup. Save buttons report server results; errors keep the form open. Unsaved content/settings changes trigger navigation warnings. Concurrent content/settings edits require reloading after a version conflict.

| Menu | How to use |
| --- | --- |
| Dashboard | Real content/status counts and recent requests; no estimated traffic or revenue |
| Homepage | Edit section copy, hero CTA destinations and expertise lines. `sections` sets order and visibility: omit a key to hide it. Keys: hero, trust, about, journey, services, videos, projects, deals, resources, testimonials, booking |
| About & Journey | Edit the existing about cards, introduction and full story copy while retaining markup |
| Services | Create/edit service, features (one per line), icon name, CTA and SEO; publish to expose the detail page |
| Portfolio | Edit projects, client, image/gallery URLs, technologies and real demo URL; leave unknown results/destinations blank |
| Blog | Create draft articles, author/tags and sanitized HTML body; publish when ready. No starter articles are published |
| Ebooks & Resources | Free/paid mode, optional price, image, download URL or media file ID. Paid flow uses WhatsApp; private files stay owner-only |
| YouTube Videos | Supply an actual YouTube watch/shorts/youtu.be URL. Synthetic source IDs are not playable video IDs |
| Deals & Recommendations | Maintain real destination, coupon, discount and expiry; expired cards show an expired label |
| Testimonials | Preserve accurate quote, name, role, rating and avatar; verify original claims before production |
| Booking Requests | Expand a request, view preferred time in Asia/Dhaka, update status and private notes. A request is not a confirmed meeting |
| Contact Messages / Leads | Search name/email and update status/notes; no external message is automatically sent |
| Media Library | Upload PNG/JPEG/WebP/PDF up to 5 MB; copy /media/UUID into image fields or the UUID into a resource file ID. Edit alt metadata, inspect usage before deletion. Referenced files cannot be deleted |
| Menus & Footer | Edit footer strings/links and header menu lines in `Label|URL` format; reorder lines or remove to hide |
| SEO & Site Settings | Brand contacts/social links, portrait, site settings and default SEO fields |
| Appearance | Set the website primary color and admin accent independently. Choose Light, Dark, or System for each, then Save Appearance. Settings are stored in MySQL and apply after refresh on other open pages. |
| Account & Security | Change password; all sessions are invalidated and you sign in again |

Collections support title search, status filter, pagination, featured selection, display order, soft deletion and restore. Lower order numbers display first. Homepage services/deals/resources use featured items within the original section limits. Slugs use lowercase Latin letters, digits and hyphens; Bangla titles and content remain supported. Duplicate slugs within a collection are rejected. Slug changes do not currently generate redirects: keep existing published slugs stable.

Publication dates and deal expiry inputs use UTC, explicitly labelled in the editor. Leave publication date empty for immediate publishing. A future publication time remains private until reached. Body HTML supports paragraphs, h2/h3, lists, strong/emphasis, blockquotes and safe links; scripts, inline event handlers and arbitrary embeds are removed. The editor uses an HTML textarea rather than a WYSIWYG library.

Image/gallery fields accept safe URLs or /media/UUID. Uploads remain private until referenced by published content/settings. If a file is marked private on any resource it cannot be downloaded publicly, even if reused elsewhere. Do not mark a public cover image as a private file. No protected customer download entitlement workflow exists yet; arrange access through the existing WhatsApp channel.

Do not use the old # resource placeholder or invent video links, endorsements, discounts or results. Paid resources keep the WhatsApp request flow. New content becomes visible after saving/publishing and reloading the public page; no rebuild is required.

Image and file fields also include **Choose from media**, with filename search and previews. Gallery selection appends a media URL. Header/footer menus each support ordering and visibility through their line lists; social icon order is configurable separately. An optional brand logo URL replaces the initial letter. Homepage also exposes the shared brand/contact fields. If the homepage booking section is hidden, booking/contact CTAs use dedicated request pages.

The admin uses a compact sidebar on desktop and an **Admin menu** drawer on smaller screens. Tap outside the drawer or press Escape to close it. Dashboard cards open their collections; counts reflect stored content and requests. The initial admin theme is light with teal/lime styling; the public website retains dark mode and its red primary color. Migration 003 adds these defaults without changing existing content or images.


## Homepage visibility and simple gallery

Open **Homepage → Homepage sections & order**. Drag a row by its grip to place it before or after another section. On phones, drag the same grip with your finger; the page scrolls when you drag near its top/bottom edge. You can also use the up/down buttons, or focus a grip and press Arrow Up/Down (Home/End moves to the first/last position). Escape cancels an in-progress drag. Change the switches and click **Save section order & visibility**. Hidden sections keep their positions even after saving and reloading. Other homepage saves preserve both visibility and order. Header navigation, the Blog menu link and floating buttons have separate visibility switches because their positions are fixed. Open website tabs at the same origin refresh automatically. Reload a website opened under a different hostname (for example `127.0.0.1` instead of `localhost`).

Open **Events & Gallery** to edit the section heading and description, then **Save gallery text**. To add photos, select one or more PNG/JPEG/WebP files under **Add photos** and click **Add images**. Photos publish automatically; there are no slug, title, caption, location, status, SEO, or featured fields to fill in. Use **Remove image** to take a photo out of the gallery. Each file can be up to 5 MB. The public masonry gallery shows images only, with an accessible full-size viewer.

Gallery text and visibility save independently, preserving each other's values. The gallery appears at its saved position when enabled and populated. Closing CTA and Footer are independently reorderable; the CTA can remain visible when Booking is hidden. Hiding sections retains their records and filters matching header/footer menu links; direct public listing/detail URLs remain accessible.


## Website colors, navigation and calendar

In **Appearance**, you can now independently change the existing website primary/button color, deep green surfaces, lime accents, and lavender accents. Click **Save Appearance**. Existing colors are retained by migration 005; same-origin public tabs refresh after saving. Admin accent remains a separate setting.

Migration 006 adds **Home** to the editable header menu. Header links use larger text and underline the section currently at the top of the viewport; listing/detail routes mark their matching menu entry. Mobile navigation slides in and closes with Escape, close button or backdrop; reduced-motion settings skip the animation.

Booking uses a custom calendar: click the date/time box, choose a month and day, select hour/minute in your displayed timezone, and confirm. Arrow keys move between days; Escape cancels without changing the selected value. The booking request still uses the existing timezone/UTC API contract. YouTube thumbnail frames use a 16:9 ratio.

### Website loading line
In **Appearance**, toggle **Website loading line**, then click **Save Appearance**. When enabled, a thin line in the website primary color appears at the top while homepage data loads. It disappears when content is ready. Turning it off hides the visual loader; accessible loading announcements remain available. Reduced-motion visitors see a static line.

### Edit the website from the front page
1. Sign in to `/admin`, then choose **Edit Website** beside **View website**. The editor opens in a new tab at `/?edit=1`. A visitor who is not signed in is redirected to admin login.
2. Click text (or focus it and press Enter) to edit it. **Apply text** updates your draft on the page. Repeated uses of the same field, such as your name, update together. Menu text opens the stored menu as one `Label|URL` per line; the expertise strip opens one label per line.
3. Click an image to open **Choose an image**. Select a library image or upload PNG/JPEG/WebP up to 5 MB. The library supports search among loaded images and Load more. Uploads are retained in Media Library even when the page draft is discarded.
4. **Save changes** publishes all pending text/image changes together. **Discard** restores the last loaded/saved content. Closing the tab with unsaved changes prompts you. Links and form submissions are paused while editing.
5. If content was changed in another tab, saving checks record versions and rejects conflicts without partially publishing. Reload latest only when you are ready to discard your draft. An expired session requires signing in again.

The visual editor uses the existing content and settings records. Record creation/deletion, publishing, SEO configuration, section visibility and account settings remain in their existing admin modules. Automatic values such as the visitor timezone remain automatic.

### Portfolio design themes
Open **Appearance → Choose your portfolio theme**:
- **Editorial** keeps the original sculpted portrait and expressive card layout.
- **Studio** centers the introduction, adds whitespace and uses equal-width service/project cards. Its portrait shape control appears when selected.
- **Executive** uses a structured split hero, stronger sans-serif typography and crisp cards. Its portrait position control appears when selected.

Choose a thumbnail to preview the theme with your real content. Switch **Desktop/Mobile** above the live preview. Theme selection, colors, spacing, corners and motion update the isolated preview; they do not publish until **Save Appearance**. Changing themes preserves content, visibility settings and independent light/dark mode preferences. Only controls applicable to the selected theme are shown; hidden theme controls retain their saved values.

### Media library and lead boards
- The header's blue **View website** button opens the public website. The green **Edit Website** button opens the visual editor.
- **Media Library** shows image previews and PDF cards, with search, type filters and pagination. Click a card to open its inline editor. Edit the file name and alternative text, then choose **Save details**.
- **Change file** replaces the media bytes at the same URL everywhere the file is used. Save pending metadata edits first. Images must remain images and PDFs must remain PDFs (5 MB maximum). Usage is listed; referenced files cannot be deleted. Library alternative text does not override content-specific captions or descriptions.
- **Booking Requests** and **Contact Messages / Leads** each have a Kanban board: New, Contacted, Scheduled, Completed and Cancelled. Drag a card's grip to another column to save its status automatically. On smaller screens swipe the board horizontally.
- Click a lead to view its contact information/message, change status and edit internal notes, then **Save lead**. Keyboard users can open a card or press Enter on its grip to select a status in the dialog. These internal changes do not send customer notifications or create calendar events.
- If another window changed the same record, reload it before saving again.

### Integrations, custom code, contact inbox and logos (November 2026)
- **SEO & Site Settings → Integration**: enter a Meta/Facebook Pixel ID, a GTM container ID (`GTM-…`), or a TikTok Pixel ID; enable the corresponding card and save. Enter IDs here, not full snippets. Each provider can be disabled independently without losing its ID. All start disabled.
- These integrations initialize browser page-view tracking on a public page load. This is not server-side Conversions API or automatic booking/purchase conversion tracking. If GTM already installs a pixel, avoid also enabling the same pixel directly. Verify actual delivery using the provider dashboard/helper; ad blockers may prevent delivery.
- **Custom Code**: separate header/body HTML, CSS and JavaScript editors, with a master enable switch. CSS/JS fields take code without wrapper tags; HTML accepts full snippets. Code is inserted after the public application loads; this is not a before-render script hook. Public reload applies changes. Admin, visual editor and theme preview do not execute these extensions. Never put secret credentials in public code. Only install code you trust.
- **Booking Requests / Leads** retains the Kanban board. Drag anywhere on the main card to change status; a simple click opens details. On a phone, cards support touch dragging and board-edge scrolling. Scroll/swipe the board between cards when not dragging. Keyboard users can open a card and use its status selector. Name, email, phone, service, submitted message, status and internal notes can be edited in the popup.
- **Contact Messages** now has a separate inbox: message list on the left, selected message on the right. On phones, the selected message replaces the list; use the back arrow to return. Click **Edit details** to edit contact fields/message. Status and internal notes are editable directly. Phone, email and WhatsApp links open external contact apps; no outgoing chat message is sent or stored by this website. Bangladesh local mobile numbers are normalized for the WhatsApp link; other countries should include their country code.
- **Menus & Footer → Header & footer logos**: choose Text or Image separately for each position. Existing text remains available. Choose/upload an image, add alternative text and **Save logos**. Display slot: **160 × 40 px (4:1)**; recommended transparent PNG/WebP upload: **640 × 160 px**. The entire logo replaces the text lockup and fits without distortion.

Implementation references: [Meta pixel events](https://developers.facebook.com/docs/facebook-business-extension/fbe/guides/pixel-events), [Google tag platform](https://developers.google.com/tag-platform/gtagjs), [TikTok Pixel SDK](https://ads.tiktok.com/gateway/docs/index?doc_id=1701890973258754).
