import { app, port } from "./server";
import { writeFile, mkdir, rm, readdir } from "fs/promises";
import { join } from "path";
import { decrypt, getDownloadURL } from "./fns";
export const baseFolder = (...files: string[]) =>
  join(__dirname, "..", "storage", ...files);
export const getDir = (string: string) =>
  string.split("\\").slice(0, -1).join("/");
app.post("/storage/createFile", async (rq, rs) => {
  const blob = rq.body;
  const { path: filePath, content } = rq.body;
  const file = baseFolder(filePath);
  const dir = getDir(file);
  await mkdir(dir, { recursive: true });
  const arrayBuffer = await fetch(content).then((res) => res.arrayBuffer());
  const buffer = Buffer.from(arrayBuffer); // Convert ArrayBuffer to Buffer
  const uint8Array = new Uint8Array(buffer.buffer);
  await writeFile(file, uint8Array);
  rs.json({ created: true });
});
app.post("/storage/upsertFile", async (rq, rs) => {
  var body: any[] = [];
  rq.on("data", function (chunk) {
    body.push(chunk);
  });
  rq.on("end", async function () {
    const content = Buffer.concat(body);
    const { path: filePath } = rq.body;
    const file = baseFolder(filePath);
    const dir = getDir(file);
    await mkdir(dir, { recursive: true });
    const uint8Array = new Uint8Array(content.buffer);
    await writeFile(file, uint8Array);
    rs.json({ upserted: true });
  });
});
app.post("/storage/updateFile", async (rq, rs) => {
  var body: any[] = [];
  rq.on("data", function (chunk) {
    body.push(chunk);
  });
  rq.on("end", async function () {
    const content = Buffer.concat(body);
    const { path: filePath } = rq.body;
    const file = baseFolder(filePath);
    const dir = getDir(file);
    await mkdir(dir, { recursive: true });
    const uint8Array = new Uint8Array(content.buffer);
    await writeFile(file, uint8Array);
    rs.json({ updated: true });
  });
});
app.delete("/storage/deleteFile", async (rq, rs) => {
  const { path: filePath } = rq.body;
  const file = baseFolder(filePath);
  await rm(file, { force: true });
  rs.json({ deleted: true });
});
app.get("/storage/getFiles", async (rq, rs) => {
  const { path: filePath } = rq.body;
  if (!filePath) {
    rs.status(404).json({ error: "Path not found" });
    return;
  }
  const file = join("storage", filePath.toString());
  const files = await readdir(file, {
    recursive: true,
  });
  rs.json({ files });
});
app.post("/storage/getDownloadURL", async (rq, rs) => {
  const { path: filePath } = rq.body;
  if (!filePath) {
    rs.status(404).json({ error: "Path not found" });
    return;
  }
  const url = getDownloadURL(filePath.toString(), port);
  rs.json({ url });
});
app.get("/storage/show/:token", async (rq, rs) => {
  const { token } = rq.params;
  const json = JSON.parse(decrypt(token));
  const file = join(__dirname, "..", "storage", json.filePath);
  return rs.sendFile(file);
});
