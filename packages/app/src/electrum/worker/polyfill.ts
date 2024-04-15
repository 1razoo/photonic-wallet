// This is imported by worker.ts so it's executed early enough
import { Buffer } from "buffer";
globalThis.Buffer = Buffer;
