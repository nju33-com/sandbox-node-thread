const {
  isMainThread,
  parentPort,
  workerData
} = require("worker_threads");

if (isMainThread) {
  throw new Error("メインスレッドでは実行できません");
}

(async () => {
  const unified = require("unified");
  const markdown = require("remark-parse");
  const remark2rehype = require("remark-rehype");
  const minify = require("rehype-preset-minify");
  const stringify = require("rehype-stringify");

  const { contents } = workerData;

  unified()
    .use(markdown)
    .use(remark2rehype)
    .use(minify)
    .use(stringify)
    .process(contents, (err, file) => {
      if (err !== null) {
        throw err;
      }

      parentPort.postMessage({ file });
    });
})();
