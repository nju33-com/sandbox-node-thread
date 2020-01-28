const {
  Worker,
  isMainThread,
  parentPort
} = require("worker_threads");
const path = require("path");
const fs = require("fs");
const { promisify } = require("util");
const readFile = promisify(fs.readFile);

if (isMainThread) {
  /**
   * @returns {Promise<string>} README.md の中身を持つ Promise
   */
  const readReadme = () => {
    return new Promise((resolve, reject) => {
      new Worker(__filename)
        .on("message", ({ contents }) => resolve(contents))
        .on("error", error => reject(error))
        .on("exit", code => {
          if (code !== 0) {
            reject(
              new Error(
                `Worker stopped with exit code ${code}`
              )
            );
          }
        });
    });
  };

  /**
   * @returns {Promise<string>} HTML を持つ Promise
   */
  const compileMarkDownToHTML = contents => {
    return new Promise((resolve, reject) => {
      new Worker(
        path.resolve(
          __dirname,
          "workers/compile-markdown-to-html.js"
        ),
        {
          workerData: {
            contents
          }
        }
      )
        .on("message", ({ file }) => resolve(file.contents))
        .on("error", error => reject(error))
        .on("exit", code => {
          if (code !== 0)
            reject(
              new Error(
                `Worker stopped with exit code ${code}`
              )
            );
        });
    });
  };

  (async () => {
    const readmeContents = await readReadme();
    const html = await compileMarkDownToHTML(
      readmeContents
    );

    console.log(html);
  })();
} else {
  (async () => {
    const contents = await readFile(
      path.resolve(__dirname, "README.md"),
      "utf-8"
    );

    parentPort.postMessage({ contents });
  })();
}
