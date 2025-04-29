import { app, server } from "./server";
import { WebSocketServer } from "ws";
import {
  updateDoc,
  deleteDoc,
  readDoc,
  readDocs,
  readCollections,
  createDoc,
  upsertDoc,
  onCollectionSnapsot,
  onDocSnapshot,
  isDoc,
} from "./fns";
app.post("/nosql/create", async (rq, rs) => {
  const { path, data } = rq.body;
  try {
    await createDoc(path, data);
    rs.json({
      message: "record add succfully",
    });
  } catch {
    rs.status(500).json({ message: "problem" });
  }
});
app.put("/nosql/upsert", async (rq, rs) => {
  const { path, data } = rq.body;
  try {
    await upsertDoc(path, data);
    rs.json({
      message: "record upserted succfully",
    });
  } catch {
    rs.status(500).json({ message: "Problem" });
  }
});
app.put("/nosql/update", async (rq, rs) => {
  const { path, data } = rq.body;
  try {
    await updateDoc(path, data);
    rs.json({
      message: "record updated succfully",
    });
  } catch {
    rs.status(500).json({ message: "Problem" });
  }
});
app.delete("/nosql/delete", async (rq, rs) => {
  const { path } = rq.body;
  try {
    await deleteDoc(path);
    rs.json({
      message: "record deleted succfully",
    });
  } catch {
    rs.status(500).json({ message: "Problem" });
  }
});
app.post("/nosql/getDoc", async (rq, rs) => {
  const { path } = rq.body;
  try {
    const data = await readDoc(path);
    rs.json({ data });
  } catch {
    rs.status(500).json({ message: "Problem" });
  }
});
app.post("/nosql/getDocs", async (rq, rs) => {
  const { path } = rq.body;
  try {
    const data = await readDocs(path);
    rs.json({ data });
  } catch {
    rs.status(500).json({ message: "Problem" });
  }
});
app.post("/nosql/getCollections", async (rq, rs) => {
  const { path } = rq.body;
  try {
    const data = await readCollections(path);
    rs.json({ data });
  } catch {
    rs.status(500).json({ message: "Problem" });
  }
});
const wss = new WebSocketServer({ server });
interface WsData {
  path: string;
  type: "document" | "collection" | "auto";
  id: string;
}
wss.on("connection", (socket) => {
  var unSubscribe: Partial<Record<string, Function>> = {};
  socket.addEventListener("message", async (event) => {
    const data = event.data.toString();
    const dataParsed: WsData = JSON.parse(data);
    const { path, type, id } = dataParsed;
    if (!id) {
      return;
    }
    if (type === "collection") {
      unSubscribe[id] = await onCollectionSnapsot(path, (data) => {
        socket.send(JSON.stringify(data));
      });
    } else if (type === "document") {
      unSubscribe[id] = await onDocSnapshot(path, (data) => {
        socket.send(JSON.stringify(data));
      });
    } else if (type === "auto") {
      if (isDoc(path)) {
        unSubscribe[id] = await onDocSnapshot(path, (data) => {
          socket.send(JSON.stringify(data));
        });
      } else {
        unSubscribe[id] = await onCollectionSnapsot(path, (data) => {
          socket.send(JSON.stringify(data));
        });
      }
    }
  });
  socket.addEventListener("close", () => {
    Object.values(unSubscribe).forEach((fn) => fn?.());
  });
});
