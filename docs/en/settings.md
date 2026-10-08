# Extension Settings

This page will explain the settings items in the extension.

## Allow Collapsing Pinned Tabs

- Default/Recommended Value: Off ❎
- Configuration Description: Whether to allow collapsing pinned tabs. By default, it is not allowed. If configured to
  allow, pinned pages in the navigation bar will also be collapsed when TabClip collapses tabs. Recommended to keep off.

## Allow Collapsing Browser Tab Groups

- Default/Recommended Value: Off ❎
- Configuration Description: Whether to allow collapsing browser tab groups. By default, this is not allowed. If
  enabled, when TabClip collapses tabs, the pages within browser tab groups will also be collapsed. Each browser tab
  group will be stored as a separate group. Off by default.

## Default Lock Tab Groups

- Default/Recommended Value: Off ❎
- Configuration Description: When adding new tab groups, default to locking the tab group to prevent modification or
  deletion. By default, it is not locked, meaning this configuration is off by default.

## Open Tab Groups in a New Window

- Default/Recommended Value: Off ❎
- Configuration Description: Open tab groups in a new window. By default, tab groups are opened in the current window,
  meaning this configuration is off by default.

## Load Icons from Google

- Default/Recommended Value: Off ❎
- Configuration Description: When icons are not cached, load them online from Google. Note that this feature requires an
  internet connection. Generally, only imported data might lack icons (because imported tabs may never have been visited
  in the current browser, so their icons are not cached by the browser). Therefore, this configuration is off by
  default.

## Set as Startup Page

- Default/Recommended Value: On ✅
- Configuration Description: Automatically open TabClip as the homepage every time the browser starts. On by default.

## Trash

- Default/Recommended Value: Off ❎
- Configuration Description: Deleted groups stay in Trash and can be restored. When this is on, Trash appears in the
  sidebar and the top tabs, and Empty Trash is available under danger operations. When it is off, those entries are
  hidden, and deleted groups do not appear in All or Starred. Off by default.

## Keep for

- Default/Recommended Value: 30 days
- Configuration Description: Shown only while Trash is on. Choose 7 days, 30 days, 90 days, or Never. Never leaves
  deleted groups in place. Otherwise, groups older than the chosen duration are removed when you open the extension or
  save settings. Turning Trash off does not change this choice.

## Groups Per Page

- Default/Recommended Value: 10
- Configuration Description: The tab group list uses scroll loading to reduce extension memory usage. This configuration
  item determines the number of tab groups loaded each time you scroll. You generally do not need to pay attention to
  this setting.

## Tab Spacing

- Default / Recommended value: 2
- Description: Controls the vertical spacing between tab links within each tab group for layout purposes.

## Tab Whitelist

- Default / Recommended values: about:blank, about:newtab, chrome://newtab, edge://newtab
- Description: Tabs whose URLs match any of the prefixes in the whitelist will not be included in TabClip. Enter one per
  line; multiple entries are supported.
