import { register } from "node:module";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

process.env.TS_NODE_TRANSPILE_ONLY = "true";
process.env.TS_NODE_PROJECT ??= fileURLToPath(new URL("../tsconfig.json", import.meta.url));

register("ts-node/esm", pathToFileURL("./"));

