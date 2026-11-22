import prisma from "../lib/prismaClient.js";
import { io } from "socket.io-client";
import jwt from "jsonwebtoken";

const [, , chatId, doctorEmail, patientEmail, senderRoleArg] = process.argv;
const SECRET = process.env.JWT_SECRET || "your-secret";

if (!chatId || !doctorEmail || !patientEmail) {
  console.error(
    "Usage: node scripts/e2e-socket-test.mjs <chatId> <doctorEmail> <patientEmail>",
  );
  process.exit(2);
}

async function getTokenForEmail(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new Error(`No user with email ${email}`);
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  };
  return jwt.sign(payload, SECRET, { expiresIn: "2h" });
}

function connectClient(token) {
  return new Promise((resolve, reject) => {
    const socket = io("http://localhost:4000", {
      auth: { token },
      transports: ["websocket"],
    });
    const onConnectError = (err) => {
      cleanup();
      reject(err);
    };
    const onConnect = () => {
      cleanup();
      resolve(socket);
    };
    function cleanup() {
      socket.off("connect", onConnect);
      socket.off("connect_error", onConnectError);
    }
    socket.on("connect", onConnect);
    socket.on("connect_error", onConnectError);
  });
}

async function run() {
  console.log("E2E socket test starting for chat", chatId);
  try {
    const doctorToken = await getTokenForEmail(doctorEmail);
    const patientToken = await getTokenForEmail(patientEmail);

    console.log("Connecting doctor client...");
    const doctor = await connectClient(doctorToken);
    console.log("Doctor connected", doctor.id);

    console.log("Connecting patient client...");
    const patient = await connectClient(patientToken);
    console.log("Patient connected", patient.id);

    // Setup listener on the opposite client of the sender
    let received = null;
    const senderRole = senderRoleArg === "patient" ? "patient" : "doctor";
    const receiver = senderRole === "doctor" ? patient : doctor;
    receiver.on("message", (m) => {
      console.log("receiver received message event", m);
      received = m;
    });

    // Join both to the chat
    doctor.emit("join", chatId);
    patient.emit("join", chatId);
    console.log("Both joined room", chatId);

    const text = `E2E socket message (${senderRole}) ` + Date.now();

    const ack = await new Promise((resolve) => {
      const emitter = senderRole === "doctor" ? doctor : patient;
      emitter.emit("message", { chatId, text }, (ack) => resolve(ack));
      // safety timeout
      setTimeout(() => resolve({ error: "timeout" }), 8000);
    });

    console.log(`${senderRole} received ack:`, ack);

    // wait up to 8s for receiver to get the event
    const waitForReceive = new Promise((resolve) => {
      const start = Date.now();
      const iv = setInterval(async () => {
        if (received) {
          clearInterval(iv);
          resolve(received);
        } else if (Date.now() - start > 8000) {
          clearInterval(iv);
          resolve(null);
        }
      }, 200);
    });

    const receivedMsg = await waitForReceive;
    if (!receivedMsg)
      console.warn("Receiver did not receive message event within timeout");

    // Check DB for last message with that text
    const msgs = await prisma.message.findMany({
      where: { chatId, text },
      orderBy: { createdAt: "desc" },
      take: 1,
    });
    const persisted = msgs.length > 0 ? msgs[0] : null;
    console.log(
      "DB persisted message:",
      persisted
        ? { id: persisted.id, sender: persisted.sender, text: persisted.text }
        : null,
    );

    // cleanup
    doctor.disconnect();
    patient.disconnect();
    await prisma.$disconnect();

    const success = ack && !ack.error && receivedMsg && persisted;
    if (success) {
      console.log("E2E socket test succeeded");
      process.exit(0);
    } else {
      console.error("E2E socket test failed — details above");
      process.exit(3);
    }
  } catch (e) {
    console.error("E2E test error", e);
    await prisma.$disconnect();
    process.exit(1);
  }
}

run();
