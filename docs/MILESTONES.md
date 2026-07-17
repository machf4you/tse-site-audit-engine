# TSE Audit Engine Milestones

## v1.4-website-connection-v1
- WordPress website connection completed.
- Application Password authentication working.
- Website connection module verified.

## v1.5-internal-link-engine-v1
- Rebuild Internal Links implemented.
- URL normalisation fixed.
- Incoming link relationships working.
- Homepage links correctly detected.
- Internal Link Engine verified.

## v1.6-website-management-foundation
- W3 page classification fixed.
- Homepage correctly recognised as Hub.
- Priority mapping corrected.
- Duplicate homepage resolved.
- Duplicate Page/Post import resolved.
- Internal Link Engine operational.
- Link Context implemented.
- Fixed target link values.
- Dynamic browser favicons.
- Website Management foundation verified.

## v1.7-internal-link-engine-template-filter
- Switched Link Context extraction to actual DOM <a> element matching.
- Implemented template element filtering (header, footer, nav, aside, menu, sidebar) in both rendering loops and internal link graph builder.
- Verified template element filtering correctly cleans the link graph from template navigation links.

## v1.8-internal-link-engine-content-container-first
- Removed exclusion-based template element filtering completely.
- Rebuilt Internal Link Engine and Link Context extraction using a content-container-first approach.
- Implemented selector priority logic (.entry-content, .post-content, .elementor-widget-theme-post-content, article, main, body > div.elementor) and candidate scoring (based on text length and paragraph count) to select the primary content container.
- Verified link engine successfully limits graph construction to editorial/content links.


