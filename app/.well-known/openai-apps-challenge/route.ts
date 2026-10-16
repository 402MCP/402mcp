/**
 * GET /.well-known/openai-apps-challenge — domain verification for the ChatGPT
 * app directory. The response body must be the token and nothing else.
 */
const TOKEN = "c48d5TS2cTCKhGsb0WJCxU5o46r880i9vEkL2WGML18";

export async function GET() {
  return new Response(TOKEN, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=300",
    },
  });
}
