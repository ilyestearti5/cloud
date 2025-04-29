import { randomUUID } from "crypto";
import { app } from "./server";
import {
  encrypt,
  setUsers,
  deleteDoc,
  verifyUser,
  getAllUsers,
  createDoc,
  verifyToken,
  Errors,
  generateToken,
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
  const token = generateToken({
    email,
    origin,
    uid: user?.uid,
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
  const result = generateToken({
    email,
    origin,
    uid,
  });
  rs.json({
    token: result,
  });
});
app.get("/auth/all", async (rq, rs) => {
  rs.json(await getAllUsers());
  return;
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
