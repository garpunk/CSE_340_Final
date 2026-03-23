// Imports
import { setupDatabase, testConnection } from "./src/models/setup.js";
import { pgSessionConObject } from "./src/models/db.js";
import { startSessionCleanup } from "./src/utils/session-cleanup.js";
import flash from "./src/middleware/flash.js";
import routes from "./src/controllers/routes.js";
import { addLocalVariables } from "./src/middleware/global.js";
import express from "express";
import session from "express-session";
import connectPgSimple from "connect-pg-simple";
import { fileURLToPath } from "url";
import path from "path";

// Variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define the port number the server will listen on
const NODE_ENV = process.env.NODE_ENV?.toLowerCase() || "production";
const PORT = process.env.PORT || 3000;

//Express Server
const app = express();

const PgSession = connectPgSimple(session);
app.use(
  session({
    store: new PgSession({
      conObject: pgSessionConObject,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: NODE_ENV.includes("dev") !== true,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

startSessionCleanup();

/**
 * Configure Express middleware
 */

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, "public")));

// Set EJS as the templating engine
app.set("view engine", "ejs");

// Tell Express where to find your templates
app.set("views", path.join(__dirname, "src/views"));

// Parse POST bodies (after static; same order as course practice project)
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(addLocalVariables);
app.use(flash);

app.use("/", routes);

// Catch-all route for 404 errors
app.use((req, res, next) => {
  const err = new Error("Page Not Found");
  err.status = 404;
  next(err);
});

// Global error handler
app.use((err, req, res, next) => {
  // Prevent infinite loops, if a response has already been sent, do nothing
  if (res.headersSent || res.finished) {
    return next(err);
  }

  // Determine status and template
  const status = err.status || 500;
  const template =
    status === 404 ? "404" : status === 403 ? "403" : "500";

  // Prepare data for the template
  const safeUserMessage =
    status === 403
      ? err.message || "You do not have permission to view this page."
      : NODE_ENV === "production"
        ? "An error occurred"
        : err.message;

  const context = {
    title:
      status === 404
        ? "Page Not Found"
        : status === 403
          ? "Forbidden"
          : "Server Error",
    error: safeUserMessage,
    stack: NODE_ENV === "production" ? null : err.stack,
    NODE_ENV, // Our WebSocket check needs this and its convenient to pass along
  };

  // Render the appropriate error template with fallback
  try {
    res.status(status).render(`errors/${template}`, context);
  } catch (renderErr) {
    // If rendering fails, send a simple error page instead
    if (!res.headersSent) {
      res
        .status(status)
        .send(`<h1>Error ${status}</h1><p>An error occurred.</p>`);
    }
  }
});
// When in development mode, start a WebSocket server for live reloading
if (NODE_ENV.includes("dev")) {
  const ws = await import("ws");

  try {
    const wsPort = parseInt(PORT) + 1;
    const wsServer = new ws.WebSocketServer({ port: wsPort });

    wsServer.on("listening", () => {
      console.log(`WebSocket server is running on port ${wsPort}`);
    });

    wsServer.on("error", (error) => {
      console.error("WebSocket server error:", error);
    });
  } catch (error) {
    console.error("Failed to start WebSocket server:", error);
  }
}
// Start the server and listen on the specified port
app.listen(PORT, async () => {
  await setupDatabase();
  await testConnection();
  console.log(`Server is running on http://127.0.0.1:${PORT}`);
});
