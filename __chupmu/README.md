# TODO:
- Switch to IndexedDB for DB storing, and local storage for css and settings and stuffs

# How to
In Firefox: Open the about:debugging page, click the This Firefox option, click the Load Temporary Add-on button, then select any file in your extension's directory.
# ESLint Example

## What it shows

This shows how to configure a WebExtension with
[eslint](http://eslint.org/)
to protect against
writing JavaScript code that may be incompatible with modern versions of
Firefox or Chrome.

## How to use it

This requires [NodeJS](https://nodejs.org/en/) and [npm](http://npmjs.com/).

* Change into the example directory and run `npm install` to install all
  dependencies.
* Execute `npm run lint` to view a report of any coding errors.
