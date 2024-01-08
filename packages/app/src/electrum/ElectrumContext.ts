import { createContext } from "react";
import ElectrumManager from "./ElectrumManager";

const ElectrumContext = createContext<ElectrumManager | null>(null);

export default ElectrumContext;
