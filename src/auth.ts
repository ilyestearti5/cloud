import { randomUUID } from "crypto";
import { app, isValideApiKey } from "./server";
import {
  encrypt,
  setUsers,
  deleteDoc,
  verifyUser,
  getAllUsers,
  createDoc,
  verifyToken,
  Errors,
  createToken,
  ObjectUsers,
} from "./fns";
export const getToken = (auth?: string) => {
  if (!auth) {
    return null;
  }
  const [type, code] = auth.split(" ");
  return {
    type,
    code,
  };
};
app.post("/auth/sign-in-with-email-and-password", async (rq, rs) => {
  const { email, password } = rq.body;
  if (!email) {
    rs.status(500).json({
      message: "email is required!",
    });
    return;
  }
  if (!password) {
    rs.status(500).json({
      message: "password is required!",
    });
    return;
  }
  const { status, user } = await verifyUser(email, password);
  if (status === Errors.UserNotFound) {
    rs.status(404).json({ message: "User Not Found!" });
    return;
  }
  if (status === Errors.PasswordIncorrect) {
    rs.status(404).json({ message: "Password Incorrect!" });
    return;
  }
  const origin = rq.headers.origin;
  var code = crypto.randomUUID();
  const token = createToken({
    email,
    origin,
    uid: user?.uid,
    code,
  });
  rs.json({
    token,
  });
});
app.post("/auth/get-current-auth", async (rq, rs) => {
  const token = getToken(rq.headers.authorization);
  if (!token?.code) {
    rs.status(404).json({ message: "Token Not Found" });
    return;
  }
  const { user } = await verifyToken(token.code);
  if (!user) {
    rs.status(404).json({ message: "User Not Found" });
    return;
  }
  rs.json({ user });
});
app.post("/auth/create-user-with-email-and-password", async (rq, rs) => {
  const { password, email, lastname = "", firstname = "" } = rq.body;
  if (!email) {
    rs.status(500).json({
      message: "email is required!",
    });
    return;
  }
  if (!password) {
    rs.status(500).json({
      message: "password is required!",
    });
    return;
  }
  let allUsers = await getAllUsers();
  const userBefore = Object.entries(allUsers).find(
    ([, value]) => value?.email == email
  );
  if (userBefore) {
    rs.status(500).json({ message: "User Exists Before!" });
    return;
  }
  const uid = randomUUID();
  allUsers = {
    ...allUsers,
    [uid]: { email, password: encrypt(password), uid },
  };
  await createDoc(`users/${uid}`, { email, lastname, firstname, uid });
  await setUsers(allUsers);
  rs.json({
    message: "user added succfully",
  });
});
app.delete("/auth/delete", async (rq, rs) => {
  const token = getToken(rq.headers.authorization);
  if (!token?.code) {
    rs.status(404).json({ message: "Token Not Found" });
    return;
  }
  const { user } = await verifyToken(token?.code);
  if (!user) {
    rs.status(404).json({ message: "User Not Found" });
    return;
  }
  await deleteDoc(`users/${user.uid}`);
  const allUsers = await getAllUsers();
  delete allUsers[user.uid];
  await setUsers(allUsers);
  rs.json({ message: "User Delete Succfully" });
});
app.post("/auth/generateToken", async (rq, rs) => {
  const token = getToken(rq.headers.authorization);
  if (!token?.code) {
    rs.status(404).json({ message: "Token Not Found" });
    return;
  }
  const { status, user } = await verifyToken(token.code);
  if (!user) {
    rs.status(404).json({
      message: "User Not Found",
    });
    return;
  }
  if (status === Errors.PasswordIncorrect) {
    rs.status(404).json({
      message: "Password Incorrect",
    });
    return;
  }
  const origin = rq.headers.origin;
  const { email, uid } = user;
  var code = crypto.randomUUID();
  const result = createToken({
    email,
    origin,
    uid,
    code,
  });
  rs.json({
    token: result,
  });
});
app.post("/auth/me", async (rq, rs) => {
  const token = getToken(rq.headers.authorization);
  if (!token?.code) {
    rs.status(404).json({ message: "Token Not Found" });
    return;
  }
  const { user } = await verifyToken(token?.code);
  rs.json({ user });
});
// admin
//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------
//------------------------------------------------------------------------------------------------
var signOuts = async (uids: string[]) => {
  var users = await getAllUsers();
  for (let uid of uids) {
    var user = users[uid];
    if (user) {
      users[uid] = {
        ...user,
        code: crypto.randomUUID(),
      };
    }
  }
  await setUsers(users);
};
app.post("/admin/user/create-user-with-email-and-password", async (rq, rs) => {
  const apiKey = getToken(rq.headers.authorization?.toString());
  if (!apiKey) {
    throw "INVALIDE API KEY";
  }
  if (!isValideApiKey(apiKey.code)) {
    throw "INVALIDE API KEY";
  }
  const { password, email, lastname = "", firstname = "" } = rq.body;
  if (!email) {
    rs.status(500).json({
      message: "email is required!",
    });
    return;
  }
  if (!password) {
    rs.status(500).json({
      message: "password is required!",
    });
    return;
  }
  let allUsers = await getAllUsers();
  const userBefore = Object.entries(allUsers).find(
    ([, value]) => value?.email == email
  );
  if (userBefore) {
    rs.status(500).json({ message: "User Exists Before!" });
    return;
  }
  const uid = randomUUID();
  allUsers = {
    ...allUsers,
    [uid]: { email, password: encrypt(password), uid },
  };
  await createDoc(`users/${uid}`, { email, lastname, firstname, uid });
  await setUsers(allUsers);
  rs.json({
    message: "user added succfully",
  });
});
app.delete("/admin/user/delete", async (rq, rs) => {
  const apiKey = getToken(rq.headers.authorization?.toString());
  if (!apiKey) {
    throw "INVALIDE API KEY";
  }
  if (!isValideApiKey(apiKey.code)) {
    throw "INVALIDE API KEY";
  }
  var uids = rq.body.uids;
  if (!uids) {
    throw "UIDS IS REQUIRED";
  }
  const allUsers = await getAllUsers();
  for (let uid of uids) {
    await deleteDoc(`users/${uid}`);
    delete allUsers[uid];
  }
  await setUsers(allUsers);
  rs.json({ message: "User Delete Succfully" });
});
app.post("/admin/user/generate-token", async (rq, rs) => {
  const apiKey = getToken(rq.headers.authorization?.toString());
  if (!apiKey) {
    throw "INVALIDE API KEY";
  }
  if (!isValideApiKey(apiKey.code)) {
    throw "INVALIDE API KEY";
  }
  var uid = rq.body.uid;
  if (!uid) {
    throw "UID IS REQUIRED";
  }
  const origin = rq.headers.origin;
  var users = await getAllUsers();
  var user = users[uid];
  if (!user) {
    throw "USER NOT FOUND";
  }
  var code = crypto.randomUUID();
  const result = createToken({
    email: user.email,
    origin,
    uid,
    code,
  });
  rs.json({
    token: result,
  });
});
app.get("/admin/user/all", async (rq, rs) => {
  const apiKey = getToken(rq.headers.authorization?.toString());
  if (!apiKey) {
    throw "INVALIDE API KEY";
  }
  if (!isValideApiKey(apiKey.code)) {
    throw "INVALIDE API KEY";
  }
  rs.json(await getAllUsers());
  return;
});
app.post("/admin/user/signout", async (rq, rs) => {
  const apiKey = getToken(rq.headers.authorization?.toString());
  if (!apiKey) {
    throw "INVALIDE API KEY";
  }
  if (!isValideApiKey(apiKey.code)) {
    throw "INVALIDE API KEY";
  }
  const uids = rq.body.uids;
  if (!uids) {
    throw "UID IS REQUIRED";
  }
  await signOuts(uids);
  rs.json({
    message: "USERS DELETE SUCCFULLY",
  });
  return;
});
app.post("/admin/user/verify-token", async (rq, rs) => {
  const apiKey = getToken(rq.headers.authorization?.toString());
  if (!apiKey) {
    throw "INVALIDE API KEY";
  }
  if (!isValideApiKey(apiKey.code)) {
    throw "INVALIDE API KEY";
  }
  const token = rq.headers["user-token"]?.toString();
  if (!token) {
    rs.status(500).json({
      user: null,
      error: "TOKEN IS REQUIRED",
    });
    return;
  }
  var user = await verifyToken(token);
  if (user.status === Errors.Expired) {
    rs.status(500).json({
      user: null,
      error: "TOKEN EXPIRED",
    });
    return;
  }
  if (!user.user && user.status === Errors.UserNotFound) {
    rs.status(500).json({
      user: null,
      error: "USER NOT FOUND",
    });
    return;
  }
  rs.status(500).json({
    user: user.user,
  });
});
app.post("/admin/user/reset-passwords", async (rq, rs) => {
  const apiKey = getToken(rq.headers.authorization?.toString());
  if (!apiKey) {
    throw "INVALIDE API KEY";
  }
  if (!isValideApiKey(apiKey.code)) {
    throw "INVALIDE API KEY";
  }
  var uid = rq.body.uid;
  if (!uid) {
    throw "UID IS REQUIRED";
  }
  var allUsers = await getAllUsers();
  await refrechToken(uid, allUsers);
});
export const refrechToken = async (uid: string, allUsers?: ObjectUsers) => {
  var users = allUsers || (await getAllUsers());
  var user = users[uid];
  if (!user) {
    throw "USER NOT FOUND";
  }
  user.code = crypto.randomUUID();
  users = {
    ...users,
    user,
  };
  await setUsers(users);
};
