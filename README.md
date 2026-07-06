# BatBatProject

BatBat is a static GitHub Pages toolkit for battery-lab workflows: a battery calculator, plotter, data converter, and channel reservation system.

## Current modules

- **Channels**: browser-local 8 x 5 Neware reservation board with row-column labels, per-channel action menus, shift/control multi-select, fast reserve, and CSV export.
- **Team**: editable local reservation members with quick-reserve colors and ordering.
- **BatBat Plot**: import Neware `.xlsx`, `.csv`, and `.tsv` files, choose method presets such as CV, CD, capacity-time, rate scan, dQ/dV, EIS, and GITT, plot data in light or dark mode, and export selected plot tables.
- **Converter**: inspect detected workbook sheets and export normalized CSV tables for Origin.
- **Report**: generate a compact sample or batch report with BatBat plots, source summaries, and print-to-PDF output.
- **Calculator**: focused electrode calculator for recipe AM fraction, coating mass, areal loading, 1C current, C-rate table, and cycler copy lines.

## Data handling

Files are parsed in the browser. The app does not upload battery data to a server.

The Neware importer repairs worksheet ranges before parsing. This matters because some exported workbooks contain useful sheet data while their Excel dimension metadata incorrectly reports only `A1`.

Squidstat CSV exports with semicolon delimiters and comma decimals are parsed in the browser as well. When multiple Squidstat charge/discharge step files from the same experiment are dropped together, BatBat creates a combined cycling table for V vs t, V vs capacity, capacity vs t, and dQ/dV plots while keeping EIS, summaries, and notes separate. Optional experiment settings `.txt` files can be dropped in so reports can include instrument metadata.

## GitHub Pages

This repo is intentionally build-free for the first version. Serve the repository root with GitHub Pages:

1. Open repository settings.
2. Go to **Pages**.
3. Select **Deploy from a branch**.
4. Choose `main` and `/root`.

## Local preview

Open `index.html` directly in a browser, or run any static web server in the repository root.

## Next milestones

- Import the current channel-reservation workbook.
- Add team-wide persistence through a small backend or GitHub-backed data file.
- Add project-specific plot presets for capacity retention, voltage profiles, rate scans, and dQ/dV workflows.
