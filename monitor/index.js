// input from user
const { createInterface } = require("readline/promises");
const readLine = createInterface({
  input: process.stdin,
  output: process.stdout,
});
const question = async (query, defaultValue) => {
  const answer = await readLine.question(query);
  return answer || defaultValue || "";
};
console.clear();
console.log("Hello With Test");
let more = true;
let globalData = {
  port: "7985",
};
const setItem = (key, value) => {
  globalData = { ...globalData, [key]: value };
};
let options = [
  {
    value: "Say Hello",
    on() {
      return "Hello";
    },
  },
  {
    value: "Show Current Base Url",
    on() {
      return globalData?.port
        ? `http://localhost:${globalData.port}`
        : "no base url defined";
    },
  },
  {
    value: "Update PORT",
    async on() {
      const port = await question("Enter PORT number : ");
      setItem("port", +port);
      return "PORT changed";
    },
  },
  {
    value: "Read Collections",
    async on() {
      const url = globalData?.port && `http://localhost:${globalData.port}`;
      if (!url) {
        return "define port!!";
      }
      const path = await question("Enter Document Path : ");
      const dataUrl = new URL(url);
      dataUrl.pathname = "/nosql/getCollections";
      dataUrl.searchParams.set("path", path);
      const response = await fetch(dataUrl, {});
      const { data } = await response.json();
      return data;
    },
  },
  {
    value: "Create Document",
    async on() {
      const url = globalData?.port && `http://localhost:${globalData.port}`;
      if (!url) {
        return "define port!!";
      }
      const path = await question("Enter Document Path : ");
      const dataInput = await question(
        "Enter Data (name=ilyes,firstname=ahmed) : "
      );
      const input = dataInput.split(",").reduce((prev, current) => {
        const [key, value] = current.split("=");
        return { ...prev, [key]: value };
      }, {});
      console.log(input);
      const dataUrl = new URL(url);
      dataUrl.pathname = "/nosql/create";
      dataUrl.searchParams.set("path", path);
      dataUrl.searchParams.set("data", JSON.stringify(input));
      const response = await fetch(dataUrl, {});
      const { message } = await response.json();
      return message;
    },
  },
  {
    value: "Delete Document",
    async on() {
      const url = globalData?.port && `http://localhost:${globalData.port}`;
      if (!url) {
        return "define port!!";
      }
      const path = await question("Enter Document Path : ");
      const dataUrl = new URL(url);
      dataUrl.pathname = "/nosql/delete";
      dataUrl.searchParams.set("path", path);
      const response = await fetch(dataUrl, {});
      const { message } = await response.json();
      return message;
    },
  },
  {
    value: "Create File",
    async on() {
      const url = globalData?.port && `http://localhost:${globalData.port}`;
      if (!url) {
        return "define port!!";
      }
      const path = await question("Enter File Path : ");
      const content = await question("Enter Content File : ");
      const dataUrl = new URL(url);
      dataUrl.pathname = "/storage/createFile";
      dataUrl.searchParams.set("path", path);
      dataUrl.searchParams.set("content", content);
      const response = await fetch(dataUrl, {});
      const { created } = await response.json();
      return created;
    },
  },
  {
    value: "Delete File",
    async on() {
      const url = globalData?.port && `http://localhost:${globalData.port}`;
      if (!url) {
        return "define port!!";
      }
      const path = await question("Enter File Path : ");
      const dataUrl = new URL(url);
      dataUrl.pathname = "/storage/deleteFile";
      dataUrl.searchParams.set("path", path);
      const response = await fetch(dataUrl, {});
      const { deleted } = await response.json();
      return deleted;
    },
  },
  {
    value: "Generate Download URL",
    async on() {
      const globalUrl =
        globalData?.port && `http://localhost:${globalData.port}`;
      if (!globalUrl) {
        return "define port!!";
      }
      const path = await question("Enter File Path : ");
      const dataUrl = new URL(globalUrl);
      dataUrl.pathname = "/storage/getDownloadURL";
      dataUrl.searchParams.set("path", path);
      const response = await fetch(dataUrl, {});
      const { url } = await response.json();
      return url;
    },
  },
  {
    value: "Read Files",
    async on() {
      const globalUrl =
        globalData?.port && `http://localhost:${globalData.port}`;
      if (!globalUrl) {
        return "define port!!";
      }
      const path = await question("Enter File Path : ");
      const dataUrl = new URL(globalUrl);
      dataUrl.pathname = "/storage/getFiles";
      dataUrl.searchParams.set("path", path);
      const response = await fetch(dataUrl, {});
      const { files = [] } = await response.json();
      return files;
    },
  },
  {
    value: "Read Documents",
    async on() {
      const url = globalData?.port && `http://localhost:${globalData.port}`;
      if (!url) {
        return "define port!!";
      }
      const path = await question("Enter Collection Path : ");
      const dataUrl = new URL(url);
      dataUrl.pathname = "/nosql/getDocs";
      dataUrl.searchParams.set("path", path);
      const response = await fetch(dataUrl, {});
      const { data } = await response.json();
      return data;
    },
  },
  {
    value: "Exit ✋",
    on({ stop }) {
      stop();
      return "";
    },
  },
];
async function main() {
  while (more) {
    console.log("Clear");
    console.log("-----------------------------------------");
    console.log(
      `${Object.entries(options)
        .map(([key, value]) => `${+key + 1}. ${value.value}`)
        .join("\n")}`
    );
    console.log("-----------------------------------------");
    const choised = await question(`Enter What You Want To Do : `);
    const option = options[+choised - 1];
    console.log("-----------------------------------------");
    try {
      let result = option?.on?.({
        stop() {
          more = false;
        },
      });
      var data;
      if (result instanceof Promise) {
        data = await result;
      } else {
        data = result;
      }
      console.log(data);
    } catch {}
    await new Promise((res) => {
      setTimeout(() => {
        res();
      }, 5000);
    });
  }
}
main().then(() => {
  console.log("You Exit 😀");
  readLine.close();
});
