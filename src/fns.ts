import fs from "fs/promises";
import fsSync, { watch } from "fs";
import path from "path";
import chokidar from "chokidar";
export const idKey = "f17348e3-07fd-542f-951b-f29a0e13496d";
// crypto
export function encrypt(inputString: string, key = idKey) {
  if (typeof inputString !== "string" || typeof key !== "string") {
    throw new Error("Both inputString and key must be strings.");
  }
  let encrypted = "";
  for (let i = 0; i < inputString.length; i++) {
    encrypted += String.fromCharCode(
      inputString.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return Buffer.from(encrypted, "utf-8").toString("hex");
}
export function decrypt(hexString: string, key = idKey) {
  if (typeof hexString !== "string" || typeof key !== "string") {
    throw new Error("Both hexString and key must be strings.");
  }
  const encrypted = Buffer.from(hexString, "hex").toString("utf-8");
  let decrypted = "";
  for (let i = 0; i < encrypted.length; i++) {
    decrypted += String.fromCharCode(
      encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return decrypted;
}
export function stringToHex(inputString: string) {
  let hexString = Buffer.from(inputString, "utf-8").toString("hex");
  if (hexString.length > 24) {
    hexString = hexString.substring(0, 24);
  } else if (hexString.length < 24) {
    hexString = hexString.padEnd(24, "0");
  }
  return hexString;
}
export function hexToString(hexString: string) {
  if (hexString.length !== 24) {
    throw new Error("Hex string must be exactly 24 characters.");
  }
  return Buffer.from(hexString.replace(/0+$/, ""), "hex").toString("utf-8");
}
// storage
export const getDownloadURL = (path: string, port: number | string) => {
  const json = encrypt(JSON.stringify({ filePath: path }));
  const url = new URL(`http://localhost:${port}`);
  url.pathname = "/storage/show/" + json;
  return url.toString();
};
// auth
export const Errors = {
  UserNotFound: -1,
  PasswordIncorrect: 0,
  Success: 1,
  Expired: 2,
};
export const verifyUser = async (email: string, password: string) => {
  const users = await getAllUsersAsArray();
  const user = users.find((user) => user.email === email);
  return {
    status: !user
      ? Errors.UserNotFound
      : decrypt(user.password) === password
      ? Errors.Success
      : Errors.PasswordIncorrect,
    user,
    users,
  };
};
export const verifyToken = async (token: string) => {
  const info = readToken(token);
  const { uid, exp } = info;
  if (!uid) {
    return {
      status: Errors.UserNotFound,
    };
  }
  const currentDate = new Date();
  if (currentDate.getTime() > new Date(exp).getTime()) {
    return {
      status: Errors.Expired,
    };
  }
  const allUsers = await getAllUsers();
  const user = allUsers[uid];
  if (!user) {
    return {
      status: Errors.UserNotFound,
    };
  }
  return {
    user,
    status: Errors.Success,
  };
};
export const getAllUsers = async () => {
  let allUsers: ObjectUsers = {};
  try {
    const usersStringContent = await fs.readFile("users.json", "utf-8");
    allUsers = JSON.parse(usersStringContent);
  } catch {}
  return allUsers;
};
export interface User {
  uid: string;
  email: string;
  firstname?: string;
  lastname?: string;
  password: string;
  code?: string;
}
export interface Token {
  uid?: string;
  exp: string;
  email?: string;
  origin?: string;
  code: string;
}
export const createToken = (data: Omit<Token, "exp">) => {
  const string = JSON.stringify({
    ...data,
    exp: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
  });
  return encrypt(string);
};
export const readToken = (token: string): Token => {
  const string = decrypt(token);
  return JSON.parse(string);
};
export type ObjectUsers = Record<string, User>;
export const getAllUsersAsArray = async (objectUsers?: ObjectUsers) => {
  const users = objectUsers || (await getAllUsers());
  return Object.entries(users).map(([uid, props]) => ({ ...props, uid }));
};
export const setUsers = async (users: ObjectUsers) => {
  await fs.writeFile("users.json", JSON.stringify(users, undefined, 4));
};
// database
export const getBaseUriForDatabase = (...files: string[]) => {
  return path.join(__dirname, "..", "database", ...files);
};
export const isDoc = (path: string) => {
  const pathSegments = path.split("/");
  return pathSegments.length % 2 === 0;
};
export const isCollection = (path: string) => !isDoc(path);
export const readDoc = async (docPath: string) => {
  if (!isDoc(docPath)) {
    throw "is not a document";
  }
  const dataFile = getBaseUriForDatabase(docPath, "data.json");
  try {
    const file = await fs.readFile(dataFile, "utf-8");
    return JSON.parse(file);
  } catch {
    return null;
  }
};
interface Ref {
  id: string;
  data: any;
}
export const readDocs = async (collectionPath: string) => {
  if (!isCollection(collectionPath)) {
    throw "is not a collection";
  }
  const dataFile = getBaseUriForDatabase(collectionPath);
  const result: Ref[] = [];
  try {
    const files = await fs.readdir(dataFile);
    for (let file of files) {
      const data = await readDoc(collectionPath.concat("/" + file));
      result.push({
        id: file,
        data,
      });
    }
  } catch {}
  return result;
};
export const readCollections = async (docPath: string) => {
  if (!isDoc(docPath)) {
    throw "is not a collection";
  }
  try {
    const folderDoc = path.join("database", docPath);
    const files = await fs.readdir(folderDoc);
    return files.filter((name) => name !== "data.json");
  } catch {
    return [];
  }
};
export const updateDoc = async <T>(docPath: string, data: T) => {
  const doc = await readDoc(docPath);
  if (!doc) {
    throw "Doc not exists";
  }
  const folderDoc = getBaseUriForDatabase(docPath);
  const dataFile = path.join(folderDoc, "/data.json");
  await fs.mkdir(folderDoc, {
    recursive: true,
  });
  const newDoc = doc ? { ...doc, ...data } : data;
  await fs.writeFile(dataFile, JSON.stringify(newDoc));
};
export const createDoc = async <T>(docPath: string, data: T) => {
  const doc = await readDoc(docPath);
  if (doc) {
    throw "Doc exists before";
  }
  const folderDoc = path.join("database", docPath);
  const dataFile = path.join(folderDoc, "/data.json");
  await fs.mkdir(folderDoc, {
    recursive: true,
  });
  const newDoc = doc ? { ...doc, ...data } : data;
  await fs.writeFile(dataFile, JSON.stringify(newDoc));
};
export const upsertDoc = async (docPath: string, data: any) => {
  const doc = await readDoc(docPath);
  const folderDoc = path.join("database", docPath);
  const dataFile = path.join(folderDoc, "/data.json");
  await fs.mkdir(folderDoc, {
    recursive: true,
  });
  const newDoc = doc ? { ...doc, ...data } : data;
  await fs.writeFile(dataFile, JSON.stringify(newDoc));
};
export const deleteDoc = async (docPath: string) => {
  const document = await readDoc(docPath);
  if (!document) {
    throw "Document Not Exists";
  }
  const folderDoc = getBaseUriForDatabase(docPath);
  await fs.rm(folderDoc, { recursive: true });
};
export type OnDocSnapshotFunction<T> = (data: T | null) => void;
export interface Doc<T> {
  id: string;
  data: T;
}
export type OnCollectionSnapshotFunction<T> = (docs: Doc<T>[]) => void;
export const onDocSnapshot = async <T>(
  docPath: string,
  callback: OnDocSnapshotFunction<T>
) => {
  const fileDocPath = getBaseUriForDatabase(docPath, "data.json");
  var initData: T | null = null;
  if (fsSync.existsSync(fileDocPath)) {
    try {
      initData = await readDoc(docPath);
    } catch {}
  }
  callback(initData);
  const watcher = chokidar.watch(fileDocPath, { persistent: true });
  watcher.on("all", async () => {
    try {
      const doc = await readDoc(docPath);
      callback(doc);
    } catch {
      callback(null);
    }
  });
  return () => {
    watcher.close();
  };
};
export const onCollectionSnapsot = async <T>(
  collectionPath: string,
  callback: OnCollectionSnapshotFunction<T>
) => {
  const fileCollectionPath = getBaseUriForDatabase(collectionPath);
  console.log(fileCollectionPath);
  var initData: Doc<T>[] = [];
  if (fsSync.existsSync(fileCollectionPath)) {
    try {
      initData = await readDocs(collectionPath);
    } catch {}
  }
  callback(initData);
  const watcher = chokidar.watch(fileCollectionPath, { persistent: true });
  watcher.on("all", async () => {
    try {
      const docs = await readDocs(collectionPath);
      callback(docs);
    } catch {
      callback([]);
    }
  });
  return () => {
    watcher.close();
  };
};
