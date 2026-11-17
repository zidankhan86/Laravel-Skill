let csrf = "";
export async function editorApi(path: string, method = "GET", body?: any) {
  if (!csrf) {
    const session = await (await fetch("/api/auth/session")).json();
    if (!session.authenticated)
      throw Error(
        "Your session expired. Sign in to admin and reopen Edit Website.",
      );
    csrf = session.csrf;
  }
  const response = await fetch("/api/" + path, {
    method,
    headers: {
      ...(body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      "X-CSRF-Token": csrf,
    },
    body:
      body === undefined
        ? undefined
        : body instanceof FormData
          ? body
          : JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok)
    throw Error(
      data.error ||
        data.issues?.map((x: any) => x.message).join("; ") ||
        "Could not save",
    );
  return data;
}
