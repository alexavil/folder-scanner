const core = require("@actions/core");
const fs = require("fs-extra");
const { exec } = require("child_process");

const default_ignored_folders = ["node_modules", ".git", ".github", ".vscode"];

//Preparations
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

//The scan function
async function scan(folder) {
  let files = fs.readdirSync(folder);
  if (files.includes("files.json"))
    files.splice(files.indexOf("files.json"), 1);
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
}

console.log(`Scanning ${folder}...`);

//The scan action
scan(folder)
  .then(() => {
    console.log("Scan complete, commiting!");
    //Commit back to Github.
    exec(`git config user.email ${email}`);
    exec(`git config user.name ${username}`);
    exec(
      `git add --all && git commit -m "${commit_message}"`,
      (err, stdout, stderr) => {
        if (err) {
          console.log(err);
          core.setFailed(err.message);
        } else {
          console.log(stderr);
          console.log(stdout);
          exec("git push", (err, stdout, stderr) => {
            if (err) {
              console.log(err);
              core.setFailed(err.message);
            } else {
              console.log(stderr);
              console.log(stdout);
            }
          });
        }
      }
    );
  })
  .catch((err) => {
    core.setFailed(err.message);
  });
