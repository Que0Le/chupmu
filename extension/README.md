

# Intro
Browser extension (only supports firefox, for now) that can take databases of known accounts on pre-defined social platforms and point these accounts out in the comment section.

# How it works
Description:
- A configuration mechanism consisted of a setting page, where user can specify database source and prefered effect for each platform, a popup, and an online library to host/list such DBs.
- A database engine, to support search from a large amount of data. IndexedDB is proved to work well for now.
- A frontend that provides a few functions to user: toggle labeling account with configurated CSS effect, tool to pick account into our DB, display specific information about labeled accounts (on mouse hovering).


# How to use this extension with Firefox
In Firefox: Open the about:debugging page, click the This Firefox option, click the Load Temporary Add-on button, then select any file in your extension's directory.
Labeling can be activated using hotkey `Ctrl+Shift+U` on Windows, or press on the Page action button in the URL bar. This is only available for supported platforms!

# Some note
- Labeling is called `Cosmetic filters` in uBlock Origin: https://github.com/gorhill/uBlock/wiki/Does-uBlock-Origin-block-ads-or-just-hide-them%3F#cosmetic-filters
- `manifest.json` of uBlock: https://github.com/gorhill/uBlock/blob/master/platform/firefox/manifest.json.<br> 
Popup: https://github.com/gorhill/uBlock/blob/master/src/popup-fenix.html.<br>Contentscript: https://github.com/gorhill/uBlock/blob/master/src/js/contentscript.js


# Resources to evaluate
- Extension example from MDN: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Examples
- SQLite for js: https://github.com/sql-js/sql.js/
- Dynamic content script registration: https://github.com/mdn/webextensions-examples/tree/main/content-script-register. 
- Context menu: https://github.com/mdn/webextensions-examples/tree/master/context-menu-copy-link-with-types
- Menu key: https://github.com/mdn/webextensions-examples/tree/main/menu-accesskey-visible
- Setup the project in a more organized way: https://code.visualstudio.com/api/extension-guides/web-extensions
- Design suggest by Firefox: https://acorn.firefox.com/latest/acorn-aRSAh0Sp
- More about popup, size, how to debug, disable auto hide when click outside, ...: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/user_interface/Popups
- Open popup with hotkey specify in manifest: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/commands#special_shortcuts
- Cross platform: https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Build_a_cross_browser_extension
- ublock `element picker`: https://github.com/gorhill/uBlock/wiki/Element-picker
- css selector: https://www.w3.org/TR/selectors/#overview


# TODO:
- [x] Switch to IndexedDB for DB storing, and local storage for css and settings and stuffs
- [ ] Implement pick account and add to DB (similar to ublock's `element picker`) (WIP)
- [ ] Define and store supported platform based on the URL (come with each db)
- [ ] Popup to enter text for picker (WIP)


- [ ] Move all messages to a `json` file like this: https://github.com/gorhill/uBlock/blob/master/platform/mv3/extension/_locales/oc/messages.json. This is helpful for translating to other languages.