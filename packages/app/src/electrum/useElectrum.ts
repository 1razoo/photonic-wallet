import { useContext } from "react";
import ElectrumContext from "./ElectrumContext";
import { ElectrumWS } from "ws-electrumx-client";
import ElectrumManager from "./ElectrumManager";

export default function useElectrum() {
  const context = useContext(ElectrumContext);
  return context?.client as ElectrumWS;
}

export function useElectrumManager() {
  const context = useContext(ElectrumContext);
  return context as ElectrumManager;
}
