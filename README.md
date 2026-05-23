# BatBatProject

BatBat is a static GitHub Pages toolkit for battery-lab workflows: a battery calculator, plotter, data converter, and channel reservation system.

## Current modules

- **Channels**: browser-local 5 x 8 Neware reservation board with 40 channels, member dropdown reservations, shift/control multi-select editing, double-click details, and CSV export.
- **BatBat Plot**: import Neware `.xlsx`, `.csv`, and `.tsv` files, choose sheets and columns, plot data, and export selected plot tables.
- **Converter**: inspect detected workbook sheets and export normalized CSV tables for Origin.
- **Report**: generate a compact sample or batch report with BatBat plots, source summaries, and print-to-PDF output.
- **Calculator**: quick active-material, capacity, and C-rate calculations.

## Data handling

Files are parsed in the browser. The app does not upload battery data to a server.

The Neware importer repairs worksheet ranges before parsing. This matters because some exported workbooks contain useful sheet data while their Excel dimension metadata incorrectly reports only `A1`.

Squidstat CSV exports with semicolon delimiters and comma decimals are parsed in the browser as well. Optional experiment settings `.txt` files can be dropped in so reports can include instrument metadata.

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
- Add multi-file overlay plotting and exported Origin templates.
