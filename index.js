import * as core from "@actions/core";
const fs = require("fs-extra");
const { exec } = require("child_process");

const email = core.getInput("email");
const username = core.getInput("username");
const folder = core.getInput("folder");
const commit_message = core.getInput("commit_message");

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

    let filelist = {
      files: files,
    };

    fs.writeJsonSync(`${folder}/files.json`, filelist);
    files.forEach((file) => {
      if (fs.statSync(folder + "/" + file).isDirectory()) {
        scan(folder + "/" + file);
      }
    });
    return { oldFiles, files };
  } catch (error) {
    core.setFailed(error.message);
  }
}

function createCommit(oldFiles, files) {
  if (oldFiles === files) return console.log("No changes detected!");
  else {
    try {
      console.log("Creating a commit...");
      exec(`git add --all && git commit -m "${commit_message}" && git push`);
    } catch (error) {
      core.setFailed(error.message);
    }
  }
}

setup();
