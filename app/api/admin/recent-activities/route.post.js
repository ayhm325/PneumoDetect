import { POST as activePost } from "./route";

export async function POST(req) {
  return activePost(req);
}
