export default async function Page(_req, ctx) {
  const resp = await fetch(
    `https://api.github.com/users/${ctx.params.username}`,
  );

  if (resp.ok) {
    const { name } = await resp.json();
    return <h1>{name}</h1>;
  }

  return <h1>An error occurred</h1>;
}
