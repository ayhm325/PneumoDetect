import { GET as activeGet } from "./notifications-unread/route";

export async function GET(req) {
  return activeGet(req);
}
