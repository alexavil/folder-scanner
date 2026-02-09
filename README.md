# Folder Scanner Action

[![Codacy Badge](https://app.codacy.com/project/badge/Grade/f2e3cf303fbc45e59bbd3bfafa51295f)](https://www.codacy.com/gh/alexavil/folder-scanner/dashboard?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=alexavil/folder-scanner&amp;utm_campaign=Badge_Grade)

This action will scan all files in a specified folder 
After scanning, it will commit a .json file containing all file names.

Required settings:
- folder: Folder to scan (default: ".")
- json_name: The name of the result JSON (default: files.json)