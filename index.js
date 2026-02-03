import * as core from "@actions/core";
const fs = require("fs-extra");
const { exec } = require("child_process");

const default_ignored_folders = ["node_modules", ".git", ".github", ".vscode"];

const email = core.getInput("email");
const username = core.getInput("username");
const folder = core.getInput("folder");
const custom_ignored_folders = core.getInput("ignored_folders");
const include_ignored_folders = core.getInput("include_ignored_folders");
const commit_message = core.getInput("commit_message");

if (include_ignored_folders !== "true" && include_ignored_folders !== "false") {
  throw new Error("include_ignored_folders must be true or false");
}
let ignored_folders = default_ignored_folders;
if (custom_ignored_folders) {
  ignored_folders = ignored_folders.concat(custom_ignored_folders.split(", "));
}

async function setup() {
  try {
    console.log("Setting up git...");
    await exec(`git config user.email ${email}`);
    await exec(`git config user.name ${username}`);
    let diff = await scan(folder);
    createCommit(diff.oldFiles, diff.files);
  } catch (error) {
    core.setFailed(error.message);
  }
}

async function scan(folder) {
  try {
    let files = fs.readdirSync(folder);
    let oldFiles = [];
    if (files.includes("files.json")) {
      oldFiles = fs.readJSONSync(`${folder}/files.json`);
      files = files.filter((file) => file !== "files.json");
    }

    if (include_ignored_folders === "false") {
      files = files.filter((file) => !ignored_folders.includes(file));
    }

    let filelist = {
      files: files,
    };

    fs.writeJsonSync(`${folder}/files.json`, filelist);
    files.forEach((file) => {
      if (
        fs.statSync(folder + "/" + file).isDirectory() &&
        !ignored_folders.includes(file)
      ) {
        scan(folder + "/" + file);
      }
    });
    return { oldFiles, files };
  } catch (error) {
    core.setFailed(error.message);
  }
}

function createCommit(oldFiles, files) {
  console.log(oldFiles, files);
  if (oldFiles === files)
    return console.log("No changes to the file structure!");
  else {
    try {
      console.log("Creating a commit...");
      exec(
        `git add --all && git commit -m "${commit_message}"`,
        (err, stdout, stderr) => {
          if (err) {
            console.log(stderr);
            console.log(stdout);
            console.log(err);
            core.setFailed(err.message);
          } else {
            console.log(stderr);
            console.log(stdout);
            console.log("Pushing the commit...");
            exec("git push", (err, stdout, stderr) => {
              if (err) {
                console.log(stderr);
                console.log(stdout);
                console.log(err);
                core.setFailed(err.message);
              } else {
                console.log(stderr);
                console.log(stdout);
              }
            });
          }
        },
      );
    } catch (error) {
      core.setFailed(error.message);
    }
  }
}

setup();
