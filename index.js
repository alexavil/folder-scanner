const core = require("@actions/core");
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

console.log("Setting up git...");
exec(`git config user.email ${email}`);
exec(`git config user.name ${username}`);
console.log(`Scanning ${folder}...`);
let diff = await scan(folder);
createCommit(diff.oldFiles, diff.files);

async function scan(folder) {
  let files = fs.readdirSync(folder);
  let oldFiles = undefined;
  if (files.includes("files.json")) {
    oldFiles = fs.readJSONSync(`${folder}/files.json`);
    files.splice(files.indexOf("files.json"), 1);
  } else {
    oldFiles = [];
  }
  if (include_ignored_folders === "false") {
    let filter = files.filter((file) => ignored_folders.includes(file));
    filter.forEach((file) => files.splice(files.indexOf(file), 1));
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
}

function createCommit(oldFiles, files) {
  console.log(oldFiles, files)
  if (oldFiles === files)
    return console.log("No changes to the file structure!");
  else {
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
  }
}
