const fs = require("fs");
const path = require("path");

const assetsDir = path.join(__dirname, "..", "src", "assets");
const win = fs.readFileSync(path.join(assetsDir, "shortcut-win-k.png")).toString("base64");
const cmd = fs.readFileSync(path.join(assetsDir, "command.png")).toString("base64");

const out = `// Embedded shortcut badge images so they always load (no path/network)
export const SHORTCUT_WIN_K_DATA_URL = "data:image/png;base64,${win}";
export const SHORTCUT_CMD_K_DATA_URL = "data:image/png;base64,${cmd}";
`;

fs.writeFileSync(path.join(assetsDir, "shortcutBadges.ts"), out);
console.log("Wrote src/assets/shortcutBadges.ts");
