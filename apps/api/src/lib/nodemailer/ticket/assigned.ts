import handlebars from "handlebars";
import { prisma } from "../../../prisma";
import { createTransportProvider } from "../transport";
import { ServerBlockNoteEditor } from "@blocknote/server-util";

const editor = ServerBlockNoteEditor.create();

export async function sendAssignedEmail(email: any, content?: any) {
  try {
    const provider = await prisma.email.findFirst();

    if (provider) {
      const mail = await createTransportProvider();

      console.log("Sending email to: ", email);

      const testhtml = await prisma.emailTemplate.findFirst({
        where: {
          type: "ticket_assigned",
        },
      });

      var template = handlebars.compile(testhtml?.html);
      var htmlToSend = template({
          detail: content ? await editor.blocksToHTMLLossy(JSON.parse(content)): "",
      });

      await mail
        .sendMail({
          from: provider?.reply,
          to: email,
          subject: `A new ticket has been assigned to you`,
          text: `Hello there, a ticket has been assigned to you`,
          html: htmlToSend
        })
        .then((info: any) => {
          console.log("Message sent: %s", info.messageId);
        })
        .catch((err: any) => console.log(err));
    }
  } catch (error) {
    console.log(error);
  }
}
