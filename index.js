import * as core from "@actions/core";
import * as exec from "@actions/exec";
const fs = require("fs-extra");

const email = core.getInput("email");
const username = core.getInput("username");

const folder = core.getInput("folder", {
  required: true,
});
const json_name = core.getInput("json_name", {
  required: true,
});

const commit_message = core.getInput("commit_message");

export async function run() {
  try {
    core.info("[Folder Scanner] Setting up git...");
    exec.exec("git", ["config", "user.email", email], {
      silent: true,
    });
    exec.exec("git", ["config", "user.name", username], {
      silent: true,
    });
    core.info("[Folder Scanner] Validation...");
    switch ((await fs.stat(folder)).isDirectory()) {
      case true:
        core.info("[Folder Scanner] Scanning files...");
        let oldFiles = [];
        if (fs.existsSync(`${folder}/${json_name}`) === true)
          oldFiles = fs.readJSON(`${folder}/${json_name}`);
        let files = (await fs.readdir(folder))
          .filter((path) => fs.statSync(`${folder}/${path}`).isDirectory() === false)
          .filter((path) => path !== json_name);
        if (files.length !== 0 && files !== oldFiles) {
          core.info("[Folder Scanner] Writing structure to file...");
          await fs.writeJSON(`${folder}/${json_name}`, { files });
          core.info("[Folder Scanner] Creating commit...");
          await exec.exec("git", ["add", "-A"]);
          await exec.exec("git", ["commit", "-m", commit_message]);
          await exec.exec("git", ["push"]);
        }
        break;
      case false:
        throw new Error("The path supplied is not a directory.");
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run();
