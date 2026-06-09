# Research

Driver logbook and gate-entry applications typically combine record keeping, contact lookup, CSV import/export, and OCR-enabled plate capture.

## Similar applications and patterns

- **Guard logbooks**: tools used in gated communities and facilities to track vehicle ingress and egress with time stamps, guard approvals, and plate numbers.
- **Parking management systems**: offer vehicle check-in/check-out, plate recognition, and exportable daily reports for security and compliance.
- **Contact-driven dispatch apps**: support multiple vehicles per contact and the ability to search by name, ID, phone, or plate.
- **OCR-assisted data capture**: modern gate apps often integrate camera-based OCR for license plates and printed entry sheets, then allow users to review parsed records before saving.

- **Guard logbooks**: tools used in gated communities and facilities to track vehicle ingress and egress with time stamps, guard approvals, and plate numbers — examples: [TrackTik](https://www.tracktik.com/).
- **Parking management systems**: offer vehicle check-in/check-out, plate recognition, and exportable daily reports — examples: [ParkMobile](https://parkmobile.io/), [Passport Parking](https://www.passportinc.com/).
- **Contact-driven dispatch / fleet apps**: support multiple vehicles per contact and search by name, ID, phone, or plate — examples: [Fleetio](https://www.fleetio.com/), [Samsara](https://www.samsara.com/).
- **OCR-assisted data capture**: OCR services and libraries used for plate and document extraction — examples: [Google Cloud Vision](https://cloud.google.com/vision), [Tesseract OCR](https://github.com/tesseract-ocr/tesseract).

## Useful capabilities

- Multi-plate contact support
- Duplicate detection during imports
- Configurable export formats for Excel friendliness
- On-demand API key validation for OCR services
- Mobile-friendly table views and collapsible history sections

This repository implements these patterns for a local-browser driver logbook with Hebrew/English language support, OpenRouter OCR, and local persistence.
