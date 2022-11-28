const core = require("@actions/core");
const github = require("@actions/github");
const fs = require("fs-extra");
const { exec } = require("child_process");
const { stderr } = require("process");

try {
  const email = core.getInput("email") || process.argv[2];
  const username = core.getInput("username") || process.argv[3];
  const folder = core.getInput("folder") || process.argv[4];
  console.log(`Scanning ${folder}...`);
  function scan(folder) {
    let filelist = {
      files: fs.readdirSync(folder),
    };
    fs.writeJsonSync(`${folder}files.json`, filelist);
    files.forEach((file) => {
      console.log(folder + "/" + file);
      console.log(fs.statSync(folder + "/" + file).isDirectory());
      if (fs.statSync(folder + "/" + file).isDirectory()) {
        let filelist = {
          files: fs.readdirSync(folder + "/" + file),
        };
        fs.writeJsonSync(`${folder}/${file}/files.json`, filelist);
      }
    });
  }
  scan(folder);
  //Commit back to Github.
  exec(`git config user.email ${email}`);
  exec(`git config user.name ${username}`);
  exec(
    `git add --all && git commit -m "Add List of Files"`,
    (err, stdout, stderr) => {
      if (err) {
        console.log(err);
      } else {
        console.log(stderr);
        console.log(stdout);
        exec("git push");
      }
    }
  );
} catch (error) {
  core.setFailed(error.message);
}
