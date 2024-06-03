const map: { [key: string]: string } = {
  object: "Object",
  container: "Container",
  user: "User",
  fungible: "Fungible",
};

export default function TokenType({
  type,
  lower = false,
}: {
  type: string;
  lower?: boolean;
}) {
  const name = map[type] || map.object;
  return <>{lower ? name.toLowerCase() : name}</>;
}
