const map: { [key: string]: string } = {
  object: "Digital Object",
  container: "Container",
  user: "User",
  fungible: "Fungible Token",
};

export default function AtomTokenType({
  type,
  lower = false,
}: {
  type: string;
  lower?: boolean;
}) {
  const name = map[type] || map.object;
  return <>{lower ? name.toLowerCase() : name}</>;
}
