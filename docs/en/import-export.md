# Data Import/Export

Export data from TabClip, or import data into TabClip. Supports importing data exported from Onetab.

## Import Data from Onetab

::: warning
Note: Data exported from Onetab is in text format by default, containing only URL and title information; grouping and time information is lost. Therefore, you need to use a relevant tool to export Onetab's complete data. For details, see the link [onetab-to-json](https://github.com/Heaciy/onetab-to-json). The data exported with this tool is a JSON file. Use this JSON file to import into TabClip.
:::

## Import/Export Data from TabClip

::: info
Note: Whether importing data exported from Onetab or data exported from TabClip, incremental updates are used during import to avoid duplicate imports. Data with the same ID will be directly overwritten.
:::

Click the "More Actions" button in the navigation bar, then click "Export/Import Tab Groups" under data operations to export or import data. A progress bar will show the current operation's progress.

::: warning
Note: Data exported from TabClip can be directly re-imported into TabClip. Please do not arbitrarily modify the data format of the exported JSON file. If modifications break the original data structure, it may lead to errors during subsequent imports.
:::