const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const ffmpeg = require("fluent-ffmpeg");

let win;

app.on("ready", () => {
  win = new BrowserWindow({
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile("index.html");

  ipcMain.handle("select-video", async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      filters: [{ name: "Videos", extensions: ["mp4", "mov", "avi"] }],
      properties: ["openFile"],
    });
    if (canceled) {
      return null;
    } else {
      return filePaths[0];
    }
  });

  ipcMain.on("merge-videos", async (event, dynamicVideoPath) => {
    const { canceled, filePath } = await dialog.showSaveDialog(win, {
      title: "Save Merged Video",
      defaultPath: path.join(app.getPath("desktop"), "merged_video.mp4"),
      filters: [{ name: "Videos", extensions: ["mp4"] }],
    });

    if (canceled || !filePath) {
      return event.reply("merge-error", "Save operation was cancelled.");
    }

    const staticStartVideo = path.join(__dirname, "start.mp4");
    const staticEndVideo = path.join(__dirname, "end.mp4");

    ffmpeg()
      .input(staticStartVideo)
      .input(dynamicVideoPath)
      .input(staticEndVideo)
      .outputOptions([
        '-preset ultrafast', // Use ultrafast preset for quicker processing
        '-movflags +faststart', // Optimize for web streaming
        '-buffer_size 100M', // Increase buffer size
        '-max_interleave_delta 100M' // Increase max interleave delta
    ])
      .on("end", () => {
        event.reply("merge-complete", filePath);
      })
      .on("error", (err) => {
        event.reply("merge-error", err.message);
      })
      .mergeToFile(filePath, "./temp/"); // Save merged video to the selected path
  });
});
