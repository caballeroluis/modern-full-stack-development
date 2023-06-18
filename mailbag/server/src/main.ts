// Node imports.
import path from "path";

// Library imports.
import express, { Express, NextFunction, Request, Response } from "express";

// App imports.
import { serverInfo } from "./ServerInfo";
import * as IMAP from "./IMAP";
import * as SMTP from "./SMTP";
import * as Contacts from "./Contacts";
import { IContact } from "./Contacts";


// Our Express app.
const app: Express = express();


// Handle JSON in request bodies.
app.use(express.json());


// Serve the client.
app.use("/", express.static(path.join(__dirname, "../../client/dist")));


// Enable CORS so that we can call the API even from anywhere.
app.use(function(inRequest: Request, inResponse: Response, inNext: NextFunction) {
  inResponse.header("Access-Control-Allow-Origin", "*");
  inResponse.header("Access-Control-Allow-Methods", "GET,POST,DELETE,OPTIONS");
  inResponse.header("Access-Control-Allow-Headers", "Origin,X-Requested-With,Content-Type,Accept");
  inNext();
});


// ---------- RESTful endpoint operations begin. ----------


// Get list of mailboxes.
// cURL command for testing: curl -X GET http://localhost/mailboxes
app.get("/mailboxes",
  async (inRequest: Request, inResponse: Response) => {
    console.log("GET /mailboxes (1)");
    try {
      const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
      const mailboxes: IMAP.IMailbox[] = await imapWorker.listMailboxes();
      console.log("GET /mailboxes (1): Ok", mailboxes);
      inResponse.status(200).json(mailboxes);
    } catch (inError) {
      console.log("GET /mailboxes (1): Error", inError);
      inResponse.status(500).send("Internal Server Error");
    }
  }
);


// Get list of messages in a mailbox (does NOT include bodies).
// cURL command for testing: curl -X GET http://localhost/mailboxes/<mailbox_name>
app.get("/mailboxes/:mailbox",
  async (inRequest: Request, inResponse: Response) => {
    console.log("GET /mailboxes (2)", inRequest.params.mailbox);
    try {
      const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
      const messages: IMAP.IMessage[] = await imapWorker.listMessages({
        mailbox : inRequest.params.mailbox
      });
      console.log("GET /mailboxes (2): Ok", messages);
      inResponse.status(200).json(messages);
    } catch (inError) {
      console.log("GET /mailboxes (2): Error", inError);
      inResponse.status(500).send("Internal Server Error");
    }
  }
);


// Get a message's plain text body.
// cURL command for testing: curl -X GET http://localhost/messages/<mailbox_name>/<message_id>
app.get("/messages/:mailbox/:id",
  async (inRequest: Request, inResponse: Response) => {
    console.log("GET /messages (3)", inRequest.params.mailbox, inRequest.params.id);
    try {
      const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
      const messageBody: string = await imapWorker.getMessageBody({
        mailbox : inRequest.params.mailbox,
        id : parseInt(inRequest.params.id, 10)
      });
      console.log("GET /messages (3): Ok", messageBody);
      inResponse.status(200).send(messageBody);
    } catch (inError) {
      console.log("GET /messages (3): Error", inError);
      inResponse.status(500).send("Internal Server Error");
    }
  }
);


// Delete a message.
// cURL command for testing: curl -X DELETE http://localhost/messages/<mailbox_name>/<message_id>
app.delete("/messages/:mailbox/:id",
  async (inRequest: Request, inResponse: Response) => {
    console.log("DELETE /messages");
    try {
      const imapWorker: IMAP.Worker = new IMAP.Worker(serverInfo);
      await imapWorker.deleteMessage({
        mailbox : inRequest.params.mailbox,
        id : parseInt(inRequest.params.id, 10)
      });
      console.log("DELETE /messages: Ok");
      inResponse.status(200).send("Ok");
    } catch (inError) {
      console.log("DELETE /messages: Error", inError);
      inResponse.status(500).send("Internal Server Error");
    }
  }
);


// Send a message.
// cURL command for testing: curl -X POST -H "Content-Type: application/json" -d '{"recipient": "recipient@example.com", "subject": "Message subject", "body": "Message body"}' http://localhost/messages
app.post("/messages",
  async (inRequest: Request, inResponse: Response) => {
    console.log("POST /messages", inRequest.body);
    try {
      const smtpWorker: SMTP.Worker = new SMTP.Worker(serverInfo);
      await smtpWorker.sendMessage(inRequest.body);
      console.log("POST /messages: Ok");
      inResponse.status(201).send("Created");
    } catch (inError) {
      console.log("POST /messages: Error", inError);
      inResponse.status(500).send("Internal Server Error");
    }
  }
);


// List contacts.
// cURL command for testing: curl -X GET http://localhost/contacts
app.get("/contacts",
  async (inRequest: Request, inResponse: Response) => {
    console.log("GET /contacts");
    try {
      const contactsWorker: Contacts.Worker = new Contacts.Worker();
      const contacts: IContact[] = await contactsWorker.listContacts();
      console.log("GET /contacts: Ok", contacts);
      inResponse.status(200).json(contacts);
    } catch (inError) {
      console.log("GET /contacts: Error", inError);
      inResponse.status(500).send("Internal Server Error");
    }
  }
);


// Add a contact.
// cURL command for testing: curl -X POST -H "Content-Type: application/json" -d '{"name": "Contact name", "email": "contact@example.com"}' http://localhost/contacts
app.post("/contacts",
  async (inRequest: Request, inResponse: Response) => {
    console.log("POST /contacts", inRequest.body);
    try {
      const contactsWorker: Contacts.Worker = new Contacts.Worker();
      const contact: IContact = await contactsWorker.addContact(inRequest.body);
      console.log("POST /contacts: Ok", contact);
      inResponse.status(201).json(contact);
    } catch (inError) {
      console.log("POST /contacts: Error", inError);
      inResponse.status(400).send("Bad Request");
    }
  }
);


// Delete a contact.
// cURL command for testing: curl -X DELETE http://localhost/contacts/<contact_id>
app.delete("/contacts/:id",
  async (inRequest: Request, inResponse: Response) => {
    console.log("DELETE /contacts", inRequest.body);
    try {
      const contactsWorker: Contacts.Worker = new Contacts.Worker();
      await contactsWorker.deleteContact(inRequest.params.id);
      console.log("Contact deleted");
      inResponse.status(200).send("Ok");
    } catch (inError) {
      console.log(inError);
      inResponse.status(500).send("Internal Server Error");
    }
  }
);

// Update a contact.
// cURL command for testing: curl -X PUT -H "Content-Type: application/json" -d '{"name": "New name", "email": "new_contact@example.com"}' http://localhost/contacts/<contact_id>
app.put("/contacts/:id",
  async (inRequest: Request, inResponse: Response) => {
    console.log("PUT /contacts", inRequest.body);
    try {
      const contactsWorker: Contacts.Worker = new Contacts.Worker();
      const updatedContact: IContact = await contactsWorker.updateContact({
        _id: inRequest.params.id,
        ...inRequest.body
      });
      console.log("PUT /contacts: Ok", updatedContact);
      inResponse.status(200).json(updatedContact);
    } catch (inError) {
      console.log("PUT /contacts: Error", inError);
      inResponse.status(400).send("Bad Request");
    }
  }
);


// Start app listening.
app.listen(80, () => {
  console.log("MailBag server open for requests");
});
