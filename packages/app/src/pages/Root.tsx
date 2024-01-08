import { Navigate } from "react-router-dom";
import { wallet } from "@app/signals";

export default function Root() {
  const { exists, ready } = wallet.value;
  if (!ready) {
    return null;
  }

  if (!exists) {
    return <Navigate to="/create-wallet" />;
  }

  return <Navigate to="/home" />;
}
