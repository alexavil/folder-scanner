const core = require("@actions/core");
const fs = require("fs-extra");
const { exec } = require("child_process");

try {
  const email = core.getInput("email") || process.argv[2];
  const username = core.getInput("username") || process.argv[3];
  const folder = core.getInput("folder") || process.argv[4];
  const ignored_folders = core.getInput("ignored_folders");
  console.log(`Scanning ${folder}...`);
  async function scan(folder) {
    console.log(ignored_folders.split(","));
    let files = fs.readdirSync(folder);
    if (files.includes("files.json"))
      files.splice(files.indexOf("files.json"), 1);
    let filelist = {
      files: files,
    };
    fs.writeJsonSync(`${folder}/files.json`, filelist);
    files.forEach((file) => {
      console.log(folder + "/" + file);
      console.log(fs.statSync(folder + "/" + file).isDirectory());
      if (fs.statSync(folder + "/" + file).isDirectory() && !ignored_folders.split(", ").includes(file)) {
        scan(folder + "/" + file);
      }
    });
  }
  scan(folder).then(() => {
    console.log("Scan complete");
    //Commit back to Github.
    exec(`git config user.email ${email}`);
    exec(`git config user.name ${username}`);
    exec(
      `git add --all && git commit -m "Add list of files for selected directory"`,
      (err, stdout, stderr) => {
        if (err) {
          console.log(err);
        } else {
          console.log(stderr);
          console.log(stdout);
          console.log("Commit complete, pushing!");
          exec("git push", (err, stdout, stderr) => {
            if (err) {
              console.log(err);
            } else {
              console.log(stderr);
              console.log(stdout);
              console.log("Push complete!");
            }
          });
        }
      }
    );
  });
} catch (error) {
  core.setFailed(error.message);
}
