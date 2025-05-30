import express, { json } from "express";
import cors from "cors";
export const port = process.argv[2] || 7985;
export const app = express();
// Initialize the app
app.use(json());
app.use(cors({ origin: "*" }));
export const apiKeys = ["ilyes"];

export const isValideApiKey = (apiKey: string) => {
  return apiKeys.includes(apiKey);
};

export const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
