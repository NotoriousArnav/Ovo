// Ovo — Smart Task Manager
// SPDX-License-Identifier: GPL-3.0

import dotenv from "dotenv";
dotenv.config();

import app from "./app";

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`[Ovo Backend] Running on http://localhost:${PORT}`);
});
