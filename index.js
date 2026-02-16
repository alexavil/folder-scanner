import * as core from "@actions/core";
import * as exec from "@actions/exec";
import * as fs from "fs-extra";
import path from "path";

const email = core.getInput("email");
const username = core.getInput("username");

const folder = core.getInput("folder", {
  required: true,
});
const json_name = core.getInput("json_name", {
  required: true,
});

const commit_message = core.getInput("commit_message");

const ignored_folders = [".git", ".vscode", ".github", "node_modules"];
const ignore_list = [];

const include_subfolders = core.getInput("include_subfolders");

export async function setupGit() {
  core.info("[Folder Scanner] Setting up git...");
  exec.exec("git", ["config", "user.email", email], {
    silent: true,
  });
  exec.exec("git", ["config", "user.name", username], {
    silent: true,
  });
  await scan(folder);
  return createCommit();
}

export async function scan(folder) {
  try {
    core.info("[Folder Scanner] Validation...");
    switch ((await fs.stat(folder)).isDirectory()) {
      case true:
        core.info("[Folder Scanner] Scanning files...");
        let res = await fs.readdir(folder);
        let files = res
          .filter(
            (path) => fs.statSync(`${folder}/${path}`).isDirectory() === false,
          )
          .filter((path) => path !== json_name);
        if (files.length !== 0) {
          core.info("[Folder Scanner] Writing structure to file...");
          await fs.writeJSON(`${folder}/${json_name}`, { files });
        }
        switch (include_subfolders) {
          case "true":
            let folders = res
              .filter(
                (path) =>
                  fs.statSync(`${folder}/${path}`).isDirectory() === true,
              )
              .filter((path) => ignored_folders.includes(path) === false)
              .filter((path) => ignore_list.includes(path) === false);
            for (const subfolder of folders) {
              await scan(path.join(folder, subfolder));
            }
            break;
          default:
            break;
        }
      case false:
        throw new Error("The path supplied is not a directory.");
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

export async function createCommit() {
  core.info("[Folder Scanner] Creating commit...");
  await exec.exec("git", ["add", "-A"]);
  await exec.exec("git", ["commit", "-m", commit_message]);
  await exec.exec("git", ["push"]);
}

await setupGit();
