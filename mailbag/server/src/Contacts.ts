// Node imports.
import * as path from "path";


// Library imports.
const Datastore = require("nedb");


// Define interface to describe a contact.  Note that we'll only have an _id field when retrieving or adding, so
// it has to be optional.
export interface IContact {
  _id?: number;
  name: string;
  email: string;
  image?: string;
}


// The worker that will perform contact operations.
export class Worker {


  // The Nedb Datastore instance for contacts.
  private db: Nedb;


  /**
   * Constructor.
   */
  constructor() {

    this.db = new Datastore({
      filename : path.join(__dirname, "contacts.db"),
      autoload : true
    });

  } /* End constructor. */


  /**
   * Lists all contacts.
   *
   * @return A promise that eventually resolves to an array of IContact objects.
   */
  public listContacts(): Promise<IContact[]> {

    console.log("Contacts.Worker.listContacts()");

    return new Promise((inResolve, inReject) => {
      this.db.find(
        {},
        (inError: Error, inDocs: IContact[]) => {
          if (inError) {
            console.log("Contacts.Worker.listContacts(): Error", inError);
            inReject(inError);
          } else {
            console.log("Contacts.Worker.listContacts(): Ok", inDocs);
            inResolve(inDocs);
          }
        }
      );
    });

  } /* End listContacts(). */


  /**
   * Add a new contact.
   *
   * @param  inContact The contact to add.
   * @return           A promise that eventually resolves to an IContact object.
   */
  public addContact(inContact: IContact): Promise<IContact> {

    console.log("Contacts.Worker.addContact()", inContact);

    return new Promise((inResolve, inReject) => {
      try {
        this.db.insert(
          inContact,
          (inError: Error, inNewDoc: IContact) => {
            if (inError) {
              console.log("Contacts.Worker.addContact(): Error", inError);
              inReject(inError);
            } else {
              console.log("Contacts.Worker.addContact(): Ok", inNewDoc);
              inResolve(inNewDoc);
            }
          }
        );
      } catch (inError) {
        console.log("Contacts.Worker.addContact(): Error", inError);
        inReject(inError);
      }
    });

  } /* End addContact(). */


  /**
   * Delete a contact.
   *
   * @param  inID The ID of the contact to delete.
   * @return      A promise that eventually resolves to a string (null for success, or the error message for an error).
   */
  public deleteContact(inID: string): Promise<string> {

    console.log("Contacts.Worker.deleteContact()", inID);

    return new Promise((inResolve, inReject) => {
      try {
        this.db.remove(
          { _id : inID },
          { },
          (inError: Error, inNumRemoved: number) => {
            if (inError) {
              console.log("Contacts.Worker.deleteContact(): Error", inError);
              inReject(inError);
            } else {
              console.log("Contacts.Worker.deleteContact(): Ok", inNumRemoved);
              inResolve("Error");
            }
          }
        );
      } catch (inError) {
        console.log("Contacts.Worker.deleteContact(): Error", inError);
        inReject(inError);
      }
    });

  } /* End deleteContact(). */

  /**
   * Update a contact.
   *
   * @param  inContact The updated contact information.
   * @return           A promise that eventually resolves to an IContact object (the updated contact).
   */
  public updateContact(inContact: IContact): Promise<IContact> {

    console.log("Contacts.Worker.updateContact()", inContact);
    
    return new Promise((inResolve, inReject) => {
      try {
        this.db.update({ _id: inContact._id }, inContact, {}, (inError: Error, inNumUpdated: number) => {
          if (inError) {
            console.log("Contacts.Worker.updateContact(): Error", inError);
            inReject(inError);
          } else {
            console.log("Contacts.Worker.updateContact(): Ok", inNumUpdated);
            inResolve(inContact);
          }
        });
      } catch (inError) {
        console.log("Contacts.Worker.updateContact(): Error", inError);
        inReject(inError);
      }
    });
  } /* End updateContact(). */

  
  /**
   * Save an image with the specified filename and internal ID.
   *
   * @param filename The name of the image file.
   * @param inID The ID of the Conctact.
   * @return A promise that resolves to the path of the saved image.
   */
  public async saveImage(filename: string, inID: string): Promise<string> {
    const fs = require("fs");
    const path = require("path");
  
    const imagePath = path.join(__dirname, "../../server/uploads", filename);
    const imageData = fs.readFileSync(imagePath, { encoding: "base64" });
  
    return new Promise<string>((resolve, reject) => {
      this.db.update(
        { _id: inID },
        { $set: { image: imageData } },
        { returnUpdatedDocs: true },
        (error: Error, numUpdated: number, updatedDoc: any) => {
          if (error) {
            console.log("Contacts.Worker.saveImage(): Error", error);
            reject(error);
          } else {
            console.log("Contacts.Worker.saveImage(): Ok", updatedDoc);
            resolve(updatedDoc.image);
          }
        }
      );
    });
  }
  


} /* End class. */
