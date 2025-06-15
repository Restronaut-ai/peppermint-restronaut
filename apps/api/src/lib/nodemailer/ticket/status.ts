import handlebars from "handlebars";
import { prisma } from "../../../prisma";
import { createTransportProvider } from "../transport";
import { ServerBlockNoteEditor } from "@blocknote/server-util";

const editor = ServerBlockNoteEditor.create();

export async function sendTicketStatus(ticket: any) {
  const email = await prisma.email.findFirst();

  if (email) {
    const transport = await createTransportProvider();

    const testhtml = await prisma.emailTemplate.findFirst({
      where: {
        type: "ticket_status_changed",
      },
    });

    var template = handlebars.compile(testhtml?.html);
    var htmlToSend = template( {
      title: ticket.title,
      status: ticket.isComplete ? "COMPLETED" : "OUTSTANDING",
      detail: ticket.detail ? await editor.blocksToHTMLLossy(JSON.parse(ticket.detail)): "",
    });

    await transport
      .sendMail({
        from: email?.reply,
        to: ticket.email,
        subject: `Issue #${ticket.Number} status is now ${
          ticket.isComplete ? "COMPLETED" : "OUTSTANDING"
        }`,
        text: `Hello there, Issue #${ticket.Number}, now has a status of ${
          ticket.isComplete ? "COMPLETED" : "OUTSTANDING"
        }`,
        html: htmlToSend,
      })
      .then((info: any) => {
        console.log("Message sent: %s", info.messageId);
      })
      .catch((err: any) => console.log(err));
  }
}
