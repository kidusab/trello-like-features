export const abstractEmail = (string: string) => {
  const [name, domain] = string.split("@");
  if (!name || !domain) return string;
  const maskedName =
    name.slice(0, 3) + "*".repeat(Math.max(0, name.length - 3));
  return `${maskedName}@${domain}`;
};
