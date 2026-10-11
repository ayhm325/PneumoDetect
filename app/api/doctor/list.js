import { GET as activeGet } from "./list/route";

export async function GET(request) {
  return activeGet(request);
}
