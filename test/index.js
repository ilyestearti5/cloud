const baseUrl = "http://localhost:7985";
const setDoc = async (doc = [], content) => {
  const url = new URL(baseUrl);
  url.pathname = "/nosql/upsert";
  url.searchParams.append("path", doc.join("/"));
  url.searchParams.append("data", JSON.stringify(content));
  return await fetch(url)
    .then((res) => res.json())
    .then(console.log)
    .catch(console.error);
};
const getDoc = async (doc = []) => {
  const url = new URL(baseUrl);
  url.pathname = "/nosql/getDoc";
  url.searchParams.append("path", doc.join("/"));
  return await fetch(url)
    .then((res) => res.json())
    .then(console.log)
    .catch(console.error);
};
const getDocs = async (doc = []) => {
  const url = new URL(baseUrl);
  url.pathname = "/nosql/getDocs";
  url.searchParams.append("path", doc.join("/"));
  return await fetch(url)
    .then((res) => res.text())
    .then(console.log)
    .catch(console.error);
};
const getCollections = async (doc = []) => {
  const url = new URL(baseUrl);
  url.pathname = "/nosql/getCollections";
  url.searchParams.append("path", doc.join("/"));
  return await fetch(url)
    .then((res) => res.text())
    .then(console.log)
    .catch(console.error);
};
const setFileContent = async (fullPath, content) => {
  const url = new URL(baseUrl);
  url.pathname = "/storage/upsertFile";
  url.searchParams.append("path", fullPath);
  url.searchParams.append("path", content);
  return await fetch(url)
    .then((res) => res.json())
    .then(console.log)
    .catch(console.error);
};
async function main() {
  setFileContent("./done.json", '{ "name": "Ilyes"}');
}
main();
